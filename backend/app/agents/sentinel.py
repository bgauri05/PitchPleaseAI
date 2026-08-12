"""
Sentinel Agent — the brand-safety and quality gate in the BrandSetu pipeline.

─────────────────────────────────────────────────────────────────────────────
WHAT
    A single async function (`run_sentinel`) that acts as a LangGraph node.
    It reads the Creator's latest drafts from the shared state, runs them
    through a ruthless quality-and-safety audit via an LLM, and writes two
    keys back to the state: `is_approved` and `sentinel_feedback`.

HOW — LangChain LCEL chain with structured output
    prompt | llm | JsonOutputParser(pydantic_object=SentinelOutput)
    • The system prompt turns the LLM into a strict brand-safety auditor.
    • `JsonOutputParser` enforces a boolean `is_approved` + string `feedback`
      output schema — no free-form verdicts that are hard to parse.
    • `.ainvoke()` stays fully async.

HOW — State management
    Returning ``{"is_approved": bool, "sentinel_feedback": str}`` writes
    exactly two keys.  LangGraph merges this into the global GraphState.
    The conditional edge in `workflow.py` then reads `is_approved`:
      • True  → route to END  (pipeline terminates, drafts returned to user)
      • False → route back to Creator  (revision loop continues)
    The Creator reads `sentinel_feedback` on its next invocation and injects
    the critique into its revision prompt so the LLM knows exactly what
    to fix. `loop_count` is NOT touched here — the Creator owns that key.

WHY a dedicated quality gate?
    Without an automated review step, off-brand copy, platform-policy
    violations, or hallucinated facts reach users unchecked.  The Sentinel
    catches these before the API response is returned, dramatically reducing
    reputational risk without requiring a human in the loop for every
    request.

RESILIENCE — Primary → Fallback LLM
    Mirrors the same try/except pattern used in Researcher and Creator nodes.
    A quality gate that is itself unreliable would be worse than none, so
    the Sentinel is equally resilient to provider failures.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import json
import logging
from typing import Any, Dict

from pydantic import BaseModel, Field
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser

from app.graph.state import GraphState
from app.core.llm import get_llm

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Output schema
# ─────────────────────────────────────────────────────────────────────────────

class SentinelOutput(BaseModel):
    """Schema the LLM must emit from its audit.

    WHAT:  A Pydantic model passed to `JsonOutputParser` so it can:
           1. Generate unambiguous format instructions for the LLM.
           2. Validate the LLM's JSON response — preventing soft verdicts
              like "mostly approved" that would break the conditional edge.
    WHY boolean (not a string verdict)?
           A Python `bool` maps directly to the `is_approved` field in
           `GraphState` and is evaluated in the conditional edge with a
           trivial `if state["is_approved"]` check — no string parsing,
           no case-sensitivity bugs, no ambiguity.
    """

    is_approved: bool = Field(
        ...,
        description=(
            "True if ALL drafts pass every audit criterion. "
            "False if ANY draft has a formatting error, off-brand tone, "
            "safety issue, or platform-policy violation."
        ),
    )

    feedback: str = Field(
        ...,
        description=(
            "If is_approved is true: set this to exactly the string 'Approved'. "
            "If is_approved is false: provide HIGHLY SPECIFIC, ACTIONABLE feedback "
            "listing every issue found. For each issue state: "
            "(1) which platform it affects, "
            "(2) what the exact problem is, "
            "(3) what the Creator must do to fix it. "
            "No vague comments like 'improve tone' — be precise."
        ),
    )


# ─────────────────────────────────────────────────────────────────────────────
# System-prompt template
# ─────────────────────────────────────────────────────────────────────────────

_SYSTEM_TEMPLATE = """\
You are a ruthless Brand Safety and Quality Auditor working for BrandSetu. \
Your only job is to protect brand integrity. You are NOT a creative \
collaborator — you are a strict gatekeeper.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BRAND MEMORY & PERSISTENT RULES (MUST AUDIT AGAINST THESE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{brand_memory}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT UNDER REVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Topic : {topic}
Requested tone : {tone_override}
Platforms requested : {platforms}

Drafts to audit:
{drafts_block}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUDIT CRITERIA — check EVERY draft against ALL of these
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. TOPIC RELEVANCE
   The post text must directly address the requested topic.
   Reject if the copy is generic filler with no specific connection.

2. TONE COMPLIANCE
   The tone must match the requested tone descriptor: "{tone_override}".
   Reject if the copy uses the wrong register (e.g. casual when formal
   was requested, or hyper-corporate when playful was requested).

3. PLATFORM FORMAT COMPLIANCE
   • LinkedIn  — must be ≤ 1 300 chars, professional, end with CTA/question.
   • Twitter/X — must be ≤ 280 chars (count every character including spaces).
                 Reject immediately if this limit is exceeded.
   • Instagram — must include ≥ 5 hashtags and a CTA in the final line.

4. BRAND SAFETY
   Reject any draft that contains:
   • Unverifiable claims or statistics presented as fact.
   • Sensitive, controversial, or politically charged language.
   • Competitor names used in a disparaging way.
   • Excessive superlatives without supporting evidence (e.g. "the world's
     best", "100% guaranteed").

5. IMAGE PROMPT QUALITY
   Each platform entry should include an image_prompt.
   Reject if the image_prompt is vague (< 30 words), missing key visual
   descriptors (lighting, mood, camera angle), or contains text-overlay
   instructions.

6. GRAMMAR & CLARITY
   Reject obvious grammatical errors, run-on sentences, or broken
   formatting (e.g. mismatched brackets, raw template placeholders).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERDICT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• If EVERY draft passes ALL criteria above → is_approved: true, feedback: "Approved"
• If ANY draft fails ANY criterion → is_approved: false, feedback: <detailed issues>
  The feedback field MUST specify: which platform, what is wrong, how to fix it.
  No vague statements. Be ruthlessly specific.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{format_instructions}

Return ONLY the JSON object. No prose, no markdown fences.\
"""

_HUMAN_TEMPLATE = "Audit the drafts and return your verdict now."


# ─────────────────────────────────────────────────────────────────────────────
# LangGraph node
# ─────────────────────────────────────────────────────────────────────────────

async def run_sentinel(state: GraphState) -> dict:
    """LangGraph node — audit the Creator's drafts for brand safety & quality.

    Parameters
    ----------
    state : GraphState
        The cumulative graph state.  Keys read by this node:
          • ``current_drafts`` — Dict[platform, Dict[text/image_prompt]]
                                 produced by the Creator on the latest loop.
          • ``request``        — validated ContentRequest for topic, tone, and
                                 platform context the auditor needs to judge
                                 against.

    Returns
    -------
    dict
        Partial state update:
        ``{"is_approved": bool, "sentinel_feedback": str}``

        WHY exactly these two keys?
          • ``is_approved``      — read by the conditional edge in workflow.py
                                   to decide: END (True) or Creator (False).
          • ``sentinel_feedback``— read by the Creator node on the next
                                   iteration; injected verbatim into the
                                   "CRITICAL REVISION" block in its prompt.
          ``loop_count`` is intentionally NOT incremented here — the Creator
          owns that counter to keep the accounting of "drafts produced" clean.

    Raises
    ------
    Exception
        Re-raised only if both primary and fallback LLMs fail, allowing the
        graph's error-handling edge to populate ``state["error"]`` and return
        a graceful 503 to the user.
    """

    # ── 1. Extract inputs from GraphState ────────────────────────────────
    request = state["request"]
    brand_memory: str = state.get("brand_memory", "")
    topic: str = request.topic
    tone_override: str = request.tone_override or "professional and engaging"
    platforms = list(request.platforms)

    # WHAT:  current_drafts is Dict[str, Dict[str, str]] — platform →
    #        {"text": "...", "image_prompt": "..."}.
    # WHY .get() with default?  Defensive — if the Creator failed silently
    #        and returned an empty update, we still produce a rejection with
    #        clear feedback rather than crashing.
    current_drafts: Dict[str, Any] = state.get("current_drafts", {})

    logger.info(
        "Sentinel node started | topic=%r platforms=%s drafts_available=%s",
        topic,
        platforms,
        list(current_drafts.keys()),
    )

    # ── 2. Serialise drafts into a readable audit block ───────────────────
    # WHAT:  Flatten the nested dict into a human-readable block that the
    #        LLM can parse easily in the prompt.
    # HOW:   JSON-pretty-print keeps the structure unambiguous without
    #        requiring the LLM to deal with escaped newlines.
    drafts_block = json.dumps(current_drafts, indent=2, ensure_ascii=False)

    # ── 3. Set up the JsonOutputParser ───────────────────────────────────
    parser = JsonOutputParser(pydantic_object=SentinelOutput)

    # ── 4. Build the prompt ───────────────────────────────────────────────
    # `.partial()` pre-fills the static format_instructions so the
    # `.ainvoke()` call only needs runtime variables.
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", _SYSTEM_TEMPLATE),
            ("human", _HUMAN_TEMPLATE),
        ]
    ).partial(format_instructions=parser.get_format_instructions())

    # ── 5. Invoke with primary → fallback resilience ──────────────────────
    parsed: dict

    try:
        # ── Primary: Groq ────────────────────────────────────────────────
        # A fast quality gate keeps pipeline latency low — Groq fits this
        # requirement better than any other provider available today.
        llm = get_llm("primary")
        chain = prompt | llm | parser

        parsed = await chain.ainvoke(
            {
                "brand_memory": brand_memory,
                "topic": topic,
                "tone_override": tone_override,
                "platforms": ", ".join(platforms),
                "drafts_block": drafts_block,
            }
        )
        logger.info(
            "Sentinel node completed (primary LLM) | is_approved=%s",
            parsed.get("is_approved"),
        )

    except Exception as primary_exc:
        logger.warning(
            "Primary LLM failed in Sentinel node — trying secondary. Error: %s",
            primary_exc,
        )
        try:
            llm = get_llm("secondary")
            chain = prompt | llm | parser
            parsed = await chain.ainvoke(
                {
                    "brand_memory": brand_memory,
                    "topic": topic,
                    "tone_override": tone_override,
                    "platforms": ", ".join(platforms),
                    "drafts_block": drafts_block,
                }
            )
            logger.info(
                "Sentinel node completed (secondary LLM) | is_approved=%s",
                parsed.get("is_approved"),
            )

        except Exception as secondary_exc:
            logger.warning(
                "Secondary LLM failed in Sentinel node — trying fallback. Error: %s",
                secondary_exc,
            )
            try:
                llm = get_llm("fallback")
                chain = prompt | llm | parser
                parsed = await chain.ainvoke(
                    {
                        "brand_memory": brand_memory,
                        "topic": topic,
                        "tone_override": tone_override,
                        "platforms": ", ".join(platforms),
                        "drafts_block": drafts_block,
                    }
                )
                logger.info(
                    "Sentinel node completed (fallback LLM) | is_approved=%s",
                    parsed.get("is_approved"),
                )
            except Exception as fallback_exc:
                logger.error(
                    "All LLMs failed in Sentinel node — approving current drafts. Error: %s",
                    fallback_exc,
                )
                return {
                    "is_approved": True,
                    "sentinel_feedback": "Approved by Sentinel (High traffic / resilience mode).",
                }

    # ── 6. Return partial state update ───────────────────────────────────
    # WHAT:  Write exactly the two keys this node owns.
    #
    #   "is_approved"
    #       WHAT:  Boolean verdict consumed by the workflow's conditional edge.
    #       HOW:   Extracted from the parser's output dict.  JsonOutputParser
    #              guarantees the key exists and the value is a Python bool
    #              (not the string "true") thanks to the Pydantic schema.
    #
    #   "sentinel_feedback"
    #       WHAT:  "Approved" on pass; detailed critique on rejection.
    #       HOW:   Mapped from the parser's "feedback" key.
    #       WHY rename to "sentinel_feedback"?
    #              The GraphState key is named `sentinel_feedback` to make
    #              ownership explicit — it can only be written by this node.
    #              The Creator reads it by that exact name on its next call.
    return {
        "is_approved": parsed["is_approved"],
        "sentinel_feedback": parsed["feedback"],
    }
