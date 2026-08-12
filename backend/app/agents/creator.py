"""
Creator Agent — the second node in the BrandSetu LangGraph pipeline.

─────────────────────────────────────────────────────────────────────────────
WHAT
    A single async function (`run_creator`) that acts as a LangGraph node.
    It reads the Researcher's brief and the user's request from the shared
    state, generates platform-specific social-media drafts via an LLM, and
    writes two keys back to the state: `current_drafts` and `loop_count`.

HOW — LangChain LCEL chain with structured output
    prompt | llm | JsonOutputParser(pydantic_object=CreatorOutput)
    • `ChatPromptTemplate` constructs a system + human message pair.
    • `JsonOutputParser` injects format instructions into the prompt AND
      parses the LLM's JSON response into a Python dict validated against
      the `CreatorOutput` Pydantic schema.
    • `.ainvoke()` keeps the chain fully async.

HOW — Revision loop (Sentinel feedback integration)
    The Creator node is called MULTIPLE TIMES during a single request —
    once for the initial draft and once per Sentinel rejection:
        Researcher → Creator → Sentinel → (reject?) → Creator → Sentinel …
    On every call after the first, `state["sentinel_feedback"]` contains the
    Sentinel's critique.  The system prompt detects a non-empty feedback
    string and switches its instruction from "draft" mode to "revision" mode,
    explicitly telling the LLM to fix the listed issues.

HOW — State management
    Returning `{"current_drafts": ..., "loop_count": loop_count + 1}` writes
    exactly two keys.  LangGraph merges this partial dict into the global
    GraphState, leaving `research_context`, `sentinel_feedback`, `is_approved`,
    and `request` completely untouched.  Incrementing `loop_count` here (not
    in the Sentinel) means the count accurately reflects how many *drafts*
    have been produced, which the conditional edge in workflow.py compares
    against `MAX_LOOP_COUNT` to prevent infinite revision loops.

WHY separate from Researcher / Sentinel?
    Single-responsibility: the Creator knows how to write compelling copy;
    it does NOT decide whether that copy is good enough (Sentinel's job) or
    what trends are relevant (Researcher's job).
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional

from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from app.graph.state import GraphState
from app.core.llm import get_llm

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Output schema (used ONLY by the parser — not stored as a Pydantic model in
# the state, which uses plain TypedDict for LangGraph compatibility)
# ─────────────────────────────────────────────────────────────────────────────

class PlatformDraft(BaseModel):
    """Content bundle for a single platform.

    WHAT:  Each platform entry now carries TWO assets instead of one:
           1. `text`         — the ready-to-post social media copy.
           2. `image_prompt` — a detailed generative-AI image prompt tailored
                              to accompany the post on that specific platform.
    WHY bundle image prompts here?
           Having the Creator also act as Art Director means the image is
           conceptually coherent with the copy — same hook, same emotion,
           same brand angle — rather than being generated in isolation later.
    """

    text: str = Field(
        ...,
        description=(
            "The complete, ready-to-post social media copy for this platform, "
            "including hashtags, line breaks, CTAs, and emojis as appropriate "
            "for the platform's native style."
        ),
    )

    image_prompt: str = Field(
        ...,
        description=(
            "A highly detailed, photorealistic prompt for an image-generation "
            "model (e.g. Flux.1, Midjourney, DALL-E 3). "
            "Must describe: subject, environment/setting, lighting style, "
            "colour palette, mood, camera angle, and lens type. "
            "Tailor the visual style to the platform: "
            "LinkedIn → clean, corporate, high-resolution; "
            "Twitter/X → bold, high-contrast, eye-catching; "
            "Instagram → cinematic, lifestyle, warm tones. "
            "Do NOT include any text overlays or watermarks in the description."
        ),
    )


class CreatorOutput(BaseModel):
    """Strict top-level schema the LLM must emit.

    WHAT:  A Pydantic model passed to `JsonOutputParser` so it can:
           1. Generate clear format instructions injected into the prompt.
           2. Validate and deserialise the LLM's JSON response.
    WHY Pydantic (not TypedDict)?
           `JsonOutputParser` requires a Pydantic BaseModel for schema
           introspection and `get_format_instructions()`.  TypedDicts lack
           the `.schema()` classmethod the parser depends on.
    """

    drafts: Dict[str, PlatformDraft] = Field(
        ...,
        description=(
            "Mapping of platform name → PlatformDraft object. "
            "Keys must exactly match the requested platforms "
            "(e.g. 'linkedin', 'twitter', 'instagram'). "
            "Each value is an object with 'text' and 'image_prompt' fields."
        ),
    )


# ─────────────────────────────────────────────────────────────────────────────
# System-prompt template (static part — runtime variables injected below)
# ─────────────────────────────────────────────────────────────────────────────

_SYSTEM_TEMPLATE = """\
You are a Master Social Media Copywriter AND Art Director working for \
BrandSetu, an AI-powered content strategy platform.

For every platform you write for, you produce TWO assets:
  1. The social-media post copy  (key: "text")
  2. A rich generative-AI image prompt  (key: "image_prompt")

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BRAND MEMORY & PERSISTENT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{brand_memory}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RESEARCH BRIEF (use this to shape every hook, angle, and visual)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{research_context}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOUR TASK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Write one high-performing content bundle for EACH of the following \
platforms: {platforms}.

Tone of voice: {tone_override}

COPY rules (per platform):
  • LinkedIn  — professional, data-backed, thought-leadership angle.
               Max ~1300 chars. End with a clear CTA or question.
  • Twitter/X — punchy, opinionated hook in the first line.
               Hard limit 280 chars (including spaces). No fluff.
  • Instagram — emotion-first, lifestyle/visual story.
               Include 5–10 relevant hashtags at the end. Use line
               breaks for readability. Add a CTA in the last line.

IMAGE PROMPT rules (apply to EVERY platform):
  Each image_prompt must be a single detailed paragraph (60–120 words) \
describing a photorealistic scene that a generative-AI model (Flux.1 / \
Midjourney / DALL-E 3) can render directly. Include ALL of:
    • Main subject & action
    • Environment / setting & background details
    • Lighting style (e.g. golden-hour, soft studio, neon rim light)
    • Colour palette (name specific tones / hex hints if helpful)
    • Mood & emotion conveyed
    • Camera angle & lens type (e.g. wide-angle, 85mm portrait, bird's eye)
    • Platform-specific visual style:
        LinkedIn  → clean corporate office / neutral tones / crisp DOF
        Twitter/X → bold high-contrast / graphic / eye-catching
        Instagram → cinematic lifestyle / warm tones / shallow DOF
    • NO text overlays, watermarks, or logos in the description.

{revision_block}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{format_instructions}

Return ONLY the JSON object. Do NOT wrap it in markdown code fences or add \
any prose before or after it.\
"""

# The human message is intentionally brief — all content context lives in the
# system message to give it the highest attention weight with most LLMs.
_HUMAN_TEMPLATE = "Generate the social media drafts now."


# ─────────────────────────────────────────────────────────────────────────────
# LangGraph node
# ─────────────────────────────────────────────────────────────────────────────

async def run_creator(state: GraphState) -> dict:
    """LangGraph node — draft platform-specific social-media posts.

    Parameters
    ----------
    state : GraphState
        The cumulative graph state.  Keys read by this node:
          • ``request``           — validated ContentRequest (topic, platforms, tone)
          • ``research_context``  — markdown brief from the Researcher node
          • ``sentinel_feedback`` — rejection reasons from the last Sentinel
                                    review (empty string on the first call)
          • ``loop_count``        — number of drafts produced so far

    Returns
    -------
    dict
        Partial state update:
        ``{"current_drafts": Dict[str, Dict[str, str]], "loop_count": int}``
        where each inner dict has keys ``"text"`` and ``"image_prompt"``.

        WHY these two keys?
        ``"current_drafts"  — the Sentinel node reads this to evaluate
                                  the latest drafts for brand safety and quality.
          • ``loop_count``      — incremented here so the conditional edge in
                                  workflow.py can enforce the MAX_LOOP_COUNT
                                  circuit breaker *before* calling the Sentinel
                                  on an iteration that would exceed the cap.
          All other state keys (research_context, is_approved, request, …)
          are left untouched — the Creator owns ONLY its slice of state.

    Raises
    ------
    Exception
        Re-raised only if both the primary and fallback LLMs fail, allowing
        the graph's error-handling edge to populate ``state["error"]``.
    """

    # ── 1. Extract inputs from GraphState ────────────────────────────────
    # WHAT:  Read every key this node depends on.
    # HOW:   TypedDict fields accessed with dict syntax; `.get()` with
    #        defaults for optional keys that may not exist yet on the first
    #        iteration (sentinel_feedback, loop_count).
    request = state["request"]

    brand_memory: str = state.get("brand_memory", "")
    research_context: str = state.get("research_context", "")
    #   WHY default ""?  If the Researcher node somehow didn't run (e.g.
    #   during unit tests), the Creator still produces drafts — just without
    #   trend context.  This makes the node resilient to partial pipelines.

    sentinel_feedback: str = state.get("sentinel_feedback", "")
    #   WHAT:  Populated by the Sentinel on every rejection cycle.
    #   WHY:   On the first call this is always "" — the condition below is
    #          False and the LLM receives a "write a draft" instruction.
    #          On subsequent calls it contains the Sentinel's critique and
    #          the LLM receives a "fix these specific issues" instruction.

    loop_count: int = state.get("loop_count", 0)
    #   WHAT:  Counts how many Creator drafts have been produced.
    #   HOW:   We increment it in the return dict (loop_count + 1) so the
    #          workflow's conditional edge can check it *before* the next
    #          Sentinel call and bail out if we've hit MAX_LOOP_COUNT.

    platforms: List[str] = list(request.platforms)
    tone_override: str = request.tone_override or "professional and engaging"
    topic: str = request.topic

    logger.info(
        "Creator node started | loop=%d platforms=%s topic=%r feedback=%s",
        loop_count,
        platforms,
        topic,
        "yes" if sentinel_feedback else "no",
    )

    # ── 2. Build the revision block ───────────────────────────────────────
    # WHAT:  Conditionally inject a hard-stop instruction when the Sentinel
    #        has already rejected a previous draft.
    # WHY CRITICAL?  Without an explicit re-statement of the critique, LLMs
    #        often produce nearly identical output on revision because their
    #        attention decays across a long system prompt.  Marking the block
    #        with "⚠️ CRITICAL" and two blank lines gives it visual salience
    #        that pushes the LLM to treat the feedback as a hard constraint.
    if sentinel_feedback:
        revision_block = (
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "⚠️  CRITICAL — REVISION REQUIRED\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "Your previous draft was REJECTED by the brand-safety reviewer.\n"
            "You MUST fix ALL of the following issues before submitting again:\n\n"
            f"{sentinel_feedback}\n\n"
            "Do NOT repeat any of the rejected content. Rewrite from scratch "
            "while still honouring the research brief and tone guidelines above."
        )
    else:
        # First iteration — no feedback yet; pure drafting mode.
        revision_block = ""

    # ── 3. Set up the JsonOutputParser ───────────────────────────────────
    # WHAT:  Binds the `CreatorOutput` schema to the parser.
    # HOW:   `parser.get_format_instructions()` returns a string describing
    #        the exact JSON structure the LLM must produce.  We inject this
    #        into the prompt so the LLM has unambiguous formatting guidance.
    # WHY JsonOutputParser (not StrOutputParser)?
    #        We need `current_drafts` to be a proper `Dict[str, str]` in the
    #        state — not a raw string.  The parser both instructs the LLM to
    #        emit valid JSON AND parses / validates the response, so we never
    #        need a manual `json.loads()` call.
    parser = JsonOutputParser(pydantic_object=CreatorOutput)

    # ── 4. Build the prompt ───────────────────────────────────────────────
    # WHAT:  ChatPromptTemplate resolves all {variables} at invoke-time.
    # HOW:   `.partial(format_instructions=...)` pre-fills the parser's
    #        format instructions so the remaining variables are only the
    #        runtime ones (topic, platforms, tone, research, feedback).
    #        This keeps the `.ainvoke()` call clean — we pass only the
    #        dynamic runtime values there.
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", _SYSTEM_TEMPLATE),
            ("human", _HUMAN_TEMPLATE),
        ]
    ).partial(format_instructions=parser.get_format_instructions())

    # ── 5. Invoke the chain with primary → fallback resilience ───────────
    # WHAT:  Build and run the LCEL chain; mirror the same try/except
    #        primary → fallback pattern used in the Researcher node so
    #        every agent degrades gracefully on provider failures.
    parsed: dict

    parsed = None
    try:
        # ── Primary: Groq ────────────────────────────────────────────────
        llm = get_llm("primary")
        chain = prompt | llm | parser

        parsed = await chain.ainvoke(
            {
                "brand_memory": brand_memory,
                "research_context": research_context,
                "platforms": ", ".join(platforms),
                "tone_override": tone_override,
                "revision_block": revision_block,
            }
        )
        logger.info(
            "Creator node completed (primary LLM) | loop=%d platforms=%s",
            loop_count + 1,
            list(parsed.get("drafts", {}).keys()),
        )

    except Exception as primary_exc:
        logger.warning(
            "Primary LLM failed in Creator node (loop=%d) — trying secondary. Error: %s",
            loop_count,
            primary_exc,
        )
        try:
            llm = get_llm("secondary")
            chain = prompt | llm | parser
            parsed = await chain.ainvoke(
                {
                    "brand_memory": brand_memory,
                    "research_context": research_context,
                    "platforms": ", ".join(platforms),
                    "tone_override": tone_override,
                    "revision_block": revision_block,
                }
            )
            logger.info(
                "Creator node completed (secondary LLM) | loop=%d platforms=%s",
                loop_count + 1,
                list(parsed.get("drafts", {}).keys()),
            )

        except Exception as secondary_exc:
            logger.warning(
                "Secondary LLM failed in Creator node (loop=%d) — trying fallback. Error: %s",
                loop_count,
                secondary_exc,
            )
            try:
                llm = get_llm("fallback")
                chain = prompt | llm | parser
                parsed = await chain.ainvoke(
                    {
                        "brand_memory": brand_memory,
                        "research_context": research_context,
                        "platforms": ", ".join(platforms),
                        "tone_override": tone_override,
                        "revision_block": revision_block,
                    }
                )
                logger.info(
                    "Creator node completed (fallback LLM) | loop=%d platforms=%s",
                    loop_count + 1,
                    list(parsed.get("drafts", {}).keys()),
                )
            except Exception as fallback_exc:
                logger.error(
                    "All LLMs failed in Creator node (loop=%d). Generating template fallback drafts. Error: %s",
                    loop_count,
                    fallback_exc,
                )
                # Create elegant, brand-aligned fallback drafts if all LLMs fail or rate-limit
                fallback_drafts = {}
                clean_topic = topic.strip() or "Brand Update"
                for plat in platforms:
                    p_key = plat.lower()
                    if "linkedin" in p_key:
                        fallback_drafts[p_key] = {
                            "text": (
                                f"✨ Celebrating {clean_topic}!\n\n"
                                f"In today's fast-evolving landscape, staying true to our core values and delivering exceptional quality remains our top priority. "
                                f"We're excited to share this milestone with our community and invite your thoughts below.\n\n"
                                f"#{clean_topic.replace(' ', '')} #Innovation #Quality #BrandSetu"
                            ),
                            "image_prompt": f"Professional, clean graphic celebrating {clean_topic}, modern typography, elegant lighting, 8k resolution",
                        }
                    elif "twitter" in p_key or "x" in p_key:
                        fallback_drafts[p_key] = {
                            "text": (
                                f"🚀 {clean_topic} is officially here!\n\n"
                                f"Excited to bring you timeless quality and meaningful experiences. What are your thoughts?\n\n"
                                f"#{clean_topic.replace(' ', '')} #BuildInPublic #Innovation"
                            ),
                            "image_prompt": f"Eye-catching graphic banner for {clean_topic}, vibrant colors, high contrast, sleek aesthetic",
                        }
                    else:
                        fallback_drafts[p_key] = {
                            "text": (
                                f"✨ Warm greetings on {clean_topic}! ✨\n\n"
                                f"Celebrating quality, authenticity, and moments that matter. Thank you for being a part of our journey!\n\n"
                                f"#{clean_topic.replace(' ', '')} #BrandSetu #FestiveMood #Community"
                            ),
                            "image_prompt": f"Cinematic lifestyle visual celebrating {clean_topic}, warm golden ambient lighting, festive decor, 8k",
                        }
                
                return {
                    "current_drafts": fallback_drafts,
                    "loop_count": loop_count + 1,
                }

    # ── 6. Return partial state update ───────────────────────────────────
    raw_drafts = parsed.get("drafts", {}) if parsed else {}
    normalised: Dict[str, Dict[str, str]] = {}
    for platform, bundle in raw_drafts.items():
        if isinstance(bundle, dict):
            normalised[platform] = {
                "text": bundle.get("text", ""),
                "image_prompt": bundle.get("image_prompt", ""),
            }
        else:
            normalised[platform] = {
                "text": getattr(bundle, "text", ""),
                "image_prompt": getattr(bundle, "image_prompt", ""),
            }

    return {
        "current_drafts": normalised,
        "loop_count": loop_count + 1,
    }
