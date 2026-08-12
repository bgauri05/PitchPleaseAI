"""
LangGraph shared state — the cyclical memory passed between agents.

─────────────────────────────────────────────────────────────────────────────
WHAT
    A `TypedDict` that defines every key the graph's state dictionary can
    hold.  LangGraph uses this schema to type-check transitions and to
    decide which keys each node is allowed to read / write.

HOW
    • We use `typing.TypedDict` with `total=False` so every key is
      optional — this is necessary because each agent writes only the
      subset of keys it is responsible for, and LangGraph **merges** the
      partial dicts returned by each node into the cumulative state.
    • The `request` key holds the original `ContentRequest` Pydantic
      model, giving every downstream agent typed access to the validated
      user input without re-parsing.

WHY TypedDict (not Pydantic)?
    LangGraph's `StateGraph` expects a TypedDict or a dataclass — not a
    Pydantic BaseModel.  TypedDict is the lightest option: it adds type
    hints for IDE / mypy support with zero runtime overhead because
    TypedDicts are just plain dicts at runtime.

SECURITY HIGHLIGHTS
    1. `loop_count` + `MAX_LOOP_COUNT` circuit breaker
       → The Sentinel node increments `loop_count` after every review.
       → The conditional edge in `workflow.py` checks `loop_count` against
         `MAX_LOOP_COUNT` and forces the graph to END if the cap is hit.
       → WHY: Without this, a Sentinel that always rejects would cause the
         Creator ↔ Sentinel loop to run forever, burning unlimited LLM
         tokens (cost-abuse denial-of-service).

    2. `is_approved` flag
       → Only the Sentinel node is allowed to set this to True.
       → The conditional edge treats this as the authoritative signal to
         stop looping and return the content to the user.
       → WHY: A clear boolean avoids ambiguous string parsing and makes
         the termination condition trivially auditable.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

from typing import Any, Dict, Optional
from typing_extensions import TypedDict

from app.models.schemas import ContentRequest


# ──────────────────────────────────────────────────────────────────────────────
# Safety constant — importable by workflow.py for the circuit-breaker check
# ──────────────────────────────────────────────────────────────────────────────
MAX_LOOP_COUNT: int = 5
"""Hard upper bound on Creator ↔ Sentinel revision cycles.

WHY a module-level constant rather than a field in the state?
  • The cap is a system invariant, not user-tunable input.
  • Keeping it outside the TypedDict means it cannot be overridden by a
    crafty request payload.
"""


# ──────────────────────────────────────────────────────────────────────────────
# Graph state
# ──────────────────────────────────────────────────────────────────────────────

class GraphState(TypedDict, total=False):
    """Shared state passed through the Researcher → Creator → Sentinel graph.

    Every agent reads the keys it needs and writes back only the keys it
    owns.  LangGraph merges the partial dict into the cumulative state.
    """

    # ── Original validated request ───────────────────────────────────────
    #   WHAT:  The Pydantic-validated ContentRequest from the API layer.
    #   WHY:   Carrying the original model means agents can access
    #          `state["request"].topic`, `.platforms`, `.tone_override`,
    #          and `.seed_url` with full type safety — no re-parsing needed.
    request: ContentRequest

    # ── Researcher output ────────────────────────────────────────────────
    #   WHAT:  Markdown-formatted research context gathered by the
    #          Researcher agent (trends, audience insights, competitor gaps).
    #   WHY Markdown:  Gives the Creator agent rich formatting hints
    #          (headings, bullet lists) that improve LLM comprehension
    #          when the research is injected into the Creator's prompt.
    research_context: str

    # ── Brand Memory ─────────────────────────────────────────────────────
    #   WHAT:  Formated Brand Memory profile (voice, values, target audience,
    #          products/services, persistent AI instructions) retrieved from
    #          Supabase/vector store for the business.
    brand_memory: str

    # ── Creator output ───────────────────────────────────────────────────
    #   WHAT:  A dict mapping each requested platform to the current draft
    #          text (e.g. {"linkedin": "…", "twitter": "…"}).
    #   WHY dict:  The Creator generates platform-specific content in a
    #          single pass; storing it per-platform allows the Sentinel to
    #          give targeted feedback and the response DTO to map directly.
    current_drafts: Dict[str, str]

    # ── Sentinel output ──────────────────────────────────────────────────
    #   WHAT:  Human-readable feedback or rejection reasons from the
    #          Sentinel's quality review.
    #   WHY str:  A single consolidated block of feedback is simpler to
    #          inject back into the Creator's revision prompt than a
    #          structured object.
    sentinel_feedback: str

    # ── Control flags ────────────────────────────────────────────────────

    loop_count: int
    #   WHAT:  Counts how many Creator ↔ Sentinel iterations have run.
    #   SECURITY:  Compared against MAX_LOOP_COUNT in the conditional edge
    #              to prevent infinite loops (see module docstring #1).

    is_approved: bool
    #   WHAT:  Set to True by the Sentinel when brand safety, tone, and
    #          platform compliance criteria are all met.
    #   HOW:   The conditional edge in workflow.py checks this flag:
    #            • True  → route to END (return content to user).
    #            • False → route back to Creator for revision.

    # ── Metadata / error ─────────────────────────────────────────────────
    error: Optional[str]
    #   Populated on unrecoverable failure — allows the API layer to return
    #   a meaningful error message without relying on exceptions alone.

    metadata: Optional[Dict[str, Any]]
    #   Ad-hoc info (execution timings, model IDs used, token counts…)
    #   that is useful for observability but not part of the core pipeline.
