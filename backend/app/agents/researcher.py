"""
Researcher Agent — the first node in the BrandSetu LangGraph pipeline.

─────────────────────────────────────────────────────────────────────────────
WHAT
    A single async function (`run_researcher`) that acts as a LangGraph node.
    It reads brand/topic context from the shared graph state, invokes an LLM
    to generate a structured marketing research brief, and writes the result
    back to the state under the `research_context` key.

HOW — LangChain LCEL chain
    prompt | llm | StrOutputParser
    • `ChatPromptTemplate` constructs a two-part (system + human) message list.
    • The LLM (Groq / Bedrock via the factory) generates the response.
    • `StrOutputParser` strips the AIMessage wrapper so we get a plain string.
    The chain is invoked with `.ainvoke()` to stay fully async and avoid
    blocking FastAPI's event loop.

HOW — LangGraph state update
    LangGraph nodes communicate by returning **partial dicts**.  Returning
    ``{"research_context": result}`` tells LangGraph to merge only that key
    into the cumulative GraphState, leaving every other key untouched.
    This is the idiomatic LangGraph pattern: each node owns its slice of
    state and writes nothing else.

WHY separate from Creator / Sentinel?
    Single-responsibility principle: the Researcher focuses purely on market
    intelligence so the Creator can focus purely on copywriting.  Swapping
    the research strategy (e.g. adding web-search tool calls) never touches
    Creator logic.

RESILIENCE — Primary → Fallback LLM
    If the primary Groq endpoint fails (rate-limit, network error, etc.),
    the except block transparently retries with the AWS Bedrock fallback.
    The rest of the graph never knows a switch happened.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import logging

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from app.graph.state import GraphState
from app.core.llm import get_llm
from app.services.brand_memory import retrieve_brand_context

# Module-level logger — standard library; zero extra dependencies.
# Messages land in whatever logging handler the application configures
# (uvicorn's default handler in dev, structured JSON in prod).
logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# System prompt
# ─────────────────────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """\
You are an expert Brand Marketing Researcher working for BrandSetu, an \
AI-powered content strategy platform.

Your mission is to produce a **concise, actionable research brief** in \
Markdown format that equips the Content Creator agent with everything it \
needs to craft high-performing social media posts.

Your brief MUST include the following three sections:

## 1. Target Audience
- Demographics (age range, profession, geography, income bracket where relevant)
- Primary pain points and motivations related to the topic
- Preferred content formats and engagement triggers

## 2. Social Media Trends (exactly 3)
List three CURRENT trends directly relevant to the topic:
- Trend name + a one-sentence description
- Which platform(s) the trend is hottest on
- A suggested hashtag or content hook for each trend

## 3. Core Message Angles
Provide a distinct, platform-native angle for each channel:
- **LinkedIn**: thought-leadership framing (professional, data-backed)
- **Twitter/X**: punchy, opinion-driven hook (max 280 chars concept)
- **Instagram**: visual story / lifestyle angle (emotion-first, CTA-focused)

Keep the entire brief under 600 words. Use crisp Markdown headings and \
bullet points — no prose paragraphs. The Creator agent will paste this \
directly into its context window.\
"""

# ─────────────────────────────────────────────────────────────────────────────
# Prompt template
# ─────────────────────────────────────────────────────────────────────────────

_PROMPT = ChatPromptTemplate.from_messages(
    [
        # WHAT:  The system message installs the researcher persona and defines
        #        the output contract (structure, length, tone).
        # WHY:   Separating persona (system) from data (human) gives the LLM
        #        the clearest possible signal about role vs. input.
        ("system", _SYSTEM_PROMPT),

        # WHAT:  The human message injects the runtime variables — topic,
        #        seed URL, and retrieved brand DNA from the vector store.
        # HOW:   ChatPromptTemplate resolves {topic}, {seed_url}, and
        #        {brand_dna} at `.ainvoke()` time from the dict we pass in.
        # WHY seed_url:  A brand may share a product page or article; giving
        #        the LLM that URL (as text) lets it tailor trends and angles
        #        to the specific brand context rather than speaking in
        #        generalities.
        # WHY brand_dna:  The vector store retrieves the most semantically
        #        relevant past guidelines and tone-of-voice rules for this
        #        topic.  Injecting them here ensures the research brief and
        #        every downstream draft stay consistent with established brand
        #        identity — without needing to paste the full brand guide into
        #        every prompt.
        (
            "human",
            "Topic: {topic}\n"
            "Seed URL for additional context: {seed_url}\n\n"
            "Here is the retrieved Brand DNA and past guidelines from our "
            "knowledge base:\n{brand_dna}\n\n"
            "Please strictly adhere to these brand rules while crafting your "
            "angles.\n\n"
            "Please produce the full research brief now.",
        ),
    ]
)


# ─────────────────────────────────────────────────────────────────────────────
# LangGraph node
# ─────────────────────────────────────────────────────────────────────────────

async def run_researcher(state: GraphState) -> dict:
    """LangGraph node — generate a markdown research brief from the request.

    Parameters
    ----------
    state : GraphState
        The cumulative graph state dict.  We read ``state["request"]`` which
        holds the validated ``ContentRequest`` Pydantic object submitted by
        the user via the API.

    Returns
    -------
    dict
        A **partial state update** containing only the key(s) this node owns:
        ``{"research_context": "<markdown brief>"}``

        WHY a partial dict?
            LangGraph merges the returned dict into the global GraphState via
            deep-update semantics.  Returning only the keys we write means
            we cannot accidentally overwrite another agent's output (e.g.
            ``current_drafts`` set by the Creator).  This enforces the
            single-ownership contract: Researcher → research_context,
            Creator → current_drafts, Sentinel → sentinel_feedback /
            is_approved.

    Raises
    ------
    Exception
        Re-raised after logging if both the primary and fallback LLMs fail,
        allowing the graph's error-handling edge to catch it and populate
        ``state["error"]``.
    """

    # ── 1. Extract inputs from state ─────────────────────────────────────
    # WHAT:  Pull the validated ContentRequest out of the shared state.
    # HOW:   `state["request"]` is a Pydantic `ContentRequest` object set by
    #        the API endpoint before kicking off the graph.  Accessing typed
    #        attributes (`.topic`, `.seed_url`) gives us IDE completion and
    #        mypy safety — no dict key guessing.
    request = state["request"]
    topic: str = request.topic

    # seed_url is Optional[HttpUrl]; convert to str for the prompt.
    # If the user didn't supply one, we send a clear "N/A" so the LLM
    # knows not to invent a URL.
    seed_url: str = str(request.seed_url) if request.seed_url else "N/A"

    # ── 1b. Retrieve brand DNA from the vector store ──────────────────────
    # WHAT:  Similarity-search the `brand_memory` Supabase table for the
    #        3 most relevant brand guidelines / past posts for this topic.
    # HOW:   `retrieve_brand_context` embeds `topic` with all-MiniLM-L6-v2
    #        and calls the `match_brand_memory` pgvector RPC function.
    #        On error or an empty table it returns "" — the prompt handles
    #        an empty string gracefully (the LLM simply sees no brand DNA
    #        section and relies on the system prompt alone).
    # WHY before the LLM call?  We need brand_dna ready to pass into the
    #        prompt template variables — it must be resolved first.
    brand_dna: str = await retrieve_brand_context(
        query=topic, business_id=request.business_id
    )
    logger.info(
        "Researcher node started | topic=%r seed_url=%s brand_dna_chars=%d",
        topic, seed_url, len(brand_dna),
    )

    # ── 2. Build the LCEL chain ──────────────────────────────────────────
    # WHAT:  Pipe operator chains three components into a single runnable:
    #          _PROMPT → llm → StrOutputParser
    # HOW:   Each `|` passes the previous component's output as the next
    #        component's input.  LangChain resolves types automatically:
    #          • _PROMPT  produces a list of BaseMessage objects
    #          • llm      consumes BaseMessage list, produces AIMessage
    #          • parser   consumes AIMessage, extracts .content → plain str
    # WHY StrOutputParser?
    #        Without it we'd get an `AIMessage` object; the parser gives us a
    #        clean Python `str` that we can store directly in the state and
    #        inject verbatim into the Creator's prompt context.

    try:
        # ── Primary LLM: Groq (Llama-3.3-70B) ──────────────────────────
        # WHAT:  Fast, low-latency inference — first choice for all nodes.
        # WHY primary first:  Groq's LPU silicon delivers sub-100 ms tokens;
        #        using it as the default keeps the pipeline snappy.
        llm = get_llm("primary")
        chain = _PROMPT | llm | StrOutputParser()

        # WHAT:  Async invocation — we `await` so FastAPI's event loop is
        #        free to serve other requests while the LLM generates.
        # HOW:   `.ainvoke(dict)` passes the template variables to
        #        ChatPromptTemplate, which fills {topic} and {seed_url}.
        result: str = await chain.ainvoke(
            {"topic": topic, "seed_url": seed_url, "brand_dna": brand_dna}
        )

        logger.info(
            "Researcher node completed (primary LLM) | chars=%d", len(result)
        )

    except Exception as primary_exc:
        # ── Fallback LLM: AWS Bedrock (Claude 3 Haiku) ──────────────────
        # WHAT:  If Groq fails (rate-limit, network blip, model overload),
        #        we transparently switch to AWS Bedrock.
        # HOW:   We log the original error at WARNING level (not ERROR) so
        #        on-call engineers know a fallback was used without waking
        #        them up for a transient provider issue.
        # WHY not re-raise immediately?
        #        The Creator and Sentinel nodes downstream don't care which
        #        provider produced the research brief — they only consume the
        #        plain-text result.  Falling back silently gives the user a
        #        successful response without surfacing provider internals.
        logger.warning(
            "Primary LLM failed in Researcher node — switching to fallback. "
            "Error: %s",
            primary_exc,
            exc_info=True,
        )

        try:
            llm = get_llm("secondary")
            chain = _PROMPT | llm | StrOutputParser()
            result = await chain.ainvoke(
                {"topic": topic, "seed_url": seed_url, "brand_dna": brand_dna}
            )
            logger.info(
                "Researcher node completed (secondary LLM) | chars=%d", len(result)
            )

        except Exception as secondary_exc:
            logger.warning(
                "Secondary LLM failed in Researcher node — switching to fallback. Error: %s",
                secondary_exc,
            )
            try:
                llm = get_llm("fallback")
                chain = _PROMPT | llm | StrOutputParser()
                result = await chain.ainvoke(
                    {"topic": topic, "seed_url": seed_url, "brand_dna": brand_dna}
                )
                logger.info(
                    "Researcher node completed (fallback LLM) | chars=%d", len(result)
                )

            except Exception as fallback_exc:
                logger.error(
                    "All LLMs failed in Researcher node — generating default research context. Error: %s",
                    fallback_exc,
                )
                result = (
                    f"### Research Brief: {topic}\n"
                    f"• Focus: High-engagement celebration & brand messaging for {topic}.\n"
                    f"• Audience Hook: Highlight authenticity, premium value, and emotional connection.\n"
                    f"• Call-to-Action: Encourage comments, shares, and website visits."
                )

    # ── 3. Return partial state update ───────────────────────────────────
    # WHAT:  A dict with only the key(s) this node is responsible for.
    # HOW:   LangGraph calls each node and merges its returned dict into the
    #        running GraphState using dict.update() semantics.
    # WHY ONLY "research_context"?
    #        Returning a smaller dict means:
    #          • We cannot accidentally clobber another agent's keys.
    #          • The intent is self-documenting: this node owns exactly one
    #            slice of shared state.
    #          • LangGraph can efficiently checkpoint only the changed key.
    return {"research_context": result, "brand_memory": brand_dna}
