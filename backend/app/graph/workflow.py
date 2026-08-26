"""
LangGraph Workflow — wires Researcher → Creator → Sentinel into a compiled
StateGraph with a quality-revision loop and a cost-protection circuit breaker.

─────────────────────────────────────────────────────────────────────────────
WHAT
    This module builds and compiles the BrandSetu multi-agent graph.
    The compiled graph object (`brand_agent_app`) is imported by the API
    endpoint and invoked once per content-generation request.

HOW — Graph topology
    ┌────────────┐    ┌─────────┐    ┌──────────┐
    │ researcher │───▶│ creator │───▶│ sentinel │
    └────────────┘    └─────────┘    └──────────┘
                             ▲               │
                             │  (rejected &  │  route_after_sentinel()
                             │  loop < 3)    ▼
                             └──────── "creator"
                                             │
                             (approved OR loop ≥ 3)
                                             ▼
                                            END

    Nodes
    ─────
    "researcher"  Reads request → writes research_context
    "creator"     Reads research_context + sentinel_feedback → writes
                  current_drafts + increments loop_count
    "sentinel"    Reads current_drafts + request → writes is_approved +
                  sentinel_feedback

    Edges
    ─────
    researcher ──(always)──▶ creator
    creator    ──(always)──▶ sentinel
    sentinel   ──(conditional, via route_after_sentinel)──▶ creator | END

HOW — Conditional routing
    `route_after_sentinel` inspects `is_approved` and `loop_count` from
    the state after every Sentinel node execution:
      • True approval  → "END"         — pipeline terminates normally.
      • loop_count ≥ 3 → "END"         — circuit breaker fires.
      • Otherwise      → "creator"     — another revision cycle begins.

    The string-to-node mapping dict in `add_conditional_edges` tells
    LangGraph which actual node or sentinel value each route string resolves
    to.  Without this mapping, LangGraph would treat the return value as a
    node name directly, which would fail for the "END" sentinel.

WHY a circuit breaker?
    Each revision loop calls the LLM at least twice (Creator + Sentinel),
    burning API tokens.  Without a hard cap, a pathological Sentinel that
    always rejects could loop forever — an unbounded cost liability.
    The cap (3 iterations = 6 LLM calls max) is a server-side constant
    defined here, so clients CANNOT override it via the request payload.

WHY `MAX_LOOP_COUNT` from state.py?
    The circuit-breaker threshold is also imported by `workflow.py` comments
    for documentation alignment, but the routing function uses the literal 3
    as specified.  In `state.py`, `MAX_LOOP_COUNT = 5` is the graph-wide
    constant — the routing function here applies a tighter local cap of 3
    (matching the task specification) to keep per-request cost lower.

SECURITY
    • The circuit breaker is evaluated server-side — `loop_count` is never
      accepted from the client; it is initialised to 0 and incremented only
      by the Creator node.
    • `is_approved` is set exclusively by the Sentinel node; the API layer
      never reads it from the incoming request body.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

from langgraph.graph import END, StateGraph

from app.graph.state import GraphState
from app.agents.researcher import run_researcher
from app.agents.creator import run_creator
from app.agents.sentinel import run_sentinel


# ─────────────────────────────────────────────────────────────────────────────
# Routing function (conditional edge after "sentinel")
# ─────────────────────────────────────────────────────────────────────────────

def route_after_sentinel(state: GraphState) -> str:
    """Decide the next node after every Sentinel review.

    Parameters
    ----------
    state : GraphState
        The cumulative graph state at the end of the Sentinel node.

    Returns
    -------
    str
        • ``"END"``     — graph terminates; result surfaced to the caller.
        • ``"creator"`` — Creator node is invoked again for a revision draft.

    Routing logic
    ─────────────
    1. APPROVED
       `is_approved` is True  →  return "END".
       The Sentinel is satisfied; no more LLM calls are needed.

    2. CIRCUIT BREAKER  (cost-protection guard)
       `loop_count` ≥ 3  →  return "END".

       WHY 3?
         Each completed loop = 1 Creator call + 1 Sentinel call = 2 LLM
         round-trips.  Capping at 3 loops keeps maximum LLM calls per
         request at 3 (Researcher) + 6 (3× Creator+Sentinel) = 9, which
         is a predictable, bounded cost per user request.

       WHY here and not in the Sentinel node?
         The routing function is the ONLY place in the graph that decides
         whether to continue looping.  Putting the check here keeps a clean
         separation of concerns:  the Sentinel evaluates quality; the
         conditional edge enforces operational limits.  This also means the
         Sentinel's `is_approved = False` verdict is respected — we don't
         silently override it inside the Sentinel itself.

    3. REVISION REQUIRED
       `is_approved` is False AND `loop_count` < 3  →  return "creator".
       The Creator node runs again with `sentinel_feedback` injected into
       its prompt (see creator.py revision_block logic).

    SECURITY NOTE
    ─────────────
    Both `is_approved` (written only by Sentinel) and `loop_count`
    (written only by Creator, initialised to 0) are server-controlled.
    A malicious client cannot short-circuit the quality gate or exhaust
    API credits by manipulating the request payload.
    """

    # ── Read control flags with safe defaults ────────────────────────────
    # WHAT:  `.get()` with defaults ensures the function behaves correctly
    #        even if a node failed to write its key (defensive programming).
    # WHY default False for is_approved?
    #        If the Sentinel somehow didn't write the key (e.g. a partially
    #        failed invocation), defaulting to False keeps the loop alive
    #        rather than silently approving bad content.
    is_approved: bool = state.get("is_approved", False)
    loop_count: int = state.get("loop_count", 0)

    # ── Decision tree ─────────────────────────────────────────────────────
    if is_approved:
        # Content passed the Sentinel's quality audit — exit the graph.
        return "END"

    if loop_count >= 3:
        # CIRCUIT BREAKER — hard stop to prevent unbounded API billing.
        # The API endpoint checks `is_approved` in the final state to
        # distinguish a genuine approval from a circuit-breaker exit and
        # can label the response accordingly (e.g. "max_iterations_reached").
        return "END"

    # Neither approved nor capped — send back to Creator for another draft.
    return "creator"


# ─────────────────────────────────────────────────────────────────────────────
# Graph construction
# ─────────────────────────────────────────────────────────────────────────────

# WHAT:  `StateGraph(GraphState)` creates an empty directed graph whose
#        node functions must accept and return subsets of `GraphState`.
# WHY TypedDict schema?
#        Passing the schema lets LangGraph validate that each node's return
#        dict only contains keys declared in `GraphState`, surfacing mistakes
#        at graph-build time rather than silently corrupting state at runtime.
workflow = StateGraph(GraphState)

# ── Register nodes ────────────────────────────────────────────────────────
# WHAT:  Associate a string node name with its async callable.
# HOW:   LangGraph calls the function with the current GraphState dict and
#        merges the returned partial dict back into the cumulative state.
# WHY direct function imports (not the old agent class wrappers)?
#        `run_researcher`, `run_creator`, `run_sentinel` are the canonical
#        LangGraph node callables.  They handle LLM init, prompt building,
#        and error handling internally — nodes.py is no longer needed.
workflow.add_node("researcher", run_researcher)
workflow.add_node("creator",    run_creator)
workflow.add_node("sentinel",   run_sentinel)

# ── Entry point ───────────────────────────────────────────────────────────
# WHAT:  Tells LangGraph which node receives the initial state when the
#        graph is invoked (e.g. via `brand_agent_app.ainvoke(initial_state)`).
# WHY researcher first?
#        Market intelligence must be gathered before copy can be written.
#        Putting Researcher first also means the Creator always has fresh
#        trend data even on revision loops (it re-uses `research_context`
#        from the state — not re-invoked on loops).
workflow.set_entry_point("researcher")

# ── Deterministic edges ───────────────────────────────────────────────────
# researcher → creator
# WHAT:  After the Researcher writes `research_context`, always run Creator.
# WHY no conditional here?  Research succeeds or raises — there is no valid
#        "skip creator" scenario at this stage.
workflow.add_edge("researcher", "creator")

# creator → sentinel
# WHAT:  After each Creator draft, always run the Sentinel for review.
# WHY unconditional?  Every draft — initial or revised — must pass the same
#        quality gate.  Skipping the Sentinel on any iteration would allow
#        unchecked content to reach the user.
workflow.add_edge("creator", "sentinel")

# ── Conditional edge (revision loop / termination) ────────────────────────
# WHAT:  After every Sentinel review, call `route_after_sentinel` to decide
#        the next step.
# HOW:   The third argument is an explicit string→node/sentinel mapping:
#          {"END": END, "creator": "creator"}
#        This tells LangGraph that when the routing function returns the
#        string "END", it should route to LangGraph's built-in `END`
#        sentinel (not a node named "END"), and "creator" maps to the node
#        registered above.
# WHY explicit mapping?
#        Without it, LangGraph would try to find a node called "END", which
#        doesn't exist and would raise a compile-time error.  The mapping
#        is the idiomatic way to route to terminal sentinels alongside normal
#        nodes in a mixed conditional edge.
workflow.add_conditional_edges(
    "sentinel",
    route_after_sentinel,
    {
        "END":     END,       # graph terminates — approved or circuit-broken
        "creator": "creator", # revision loop — Creator re-drafts with feedback
    },
)

# ─────────────────────────────────────────────────────────────────────────────
# Compiled graph — the importable entry-point for the API layer
# ─────────────────────────────────────────────────────────────────────────────

# WHAT:  `.compile()` validates the graph topology (no dangling edges, no
#        unreachable nodes) and returns a `CompiledGraph` runnable.
# HOW:   The API endpoint imports `brand_agent_app` and calls:
#            result = await brand_agent_app.ainvoke(initial_state)
# WHY this name?
#        `brand_agent_app` is explicit about what the compiled object does
#        (runs the BrandSetu multi-agent pipeline) and is easy to grep for
#        across the codebase.
brand_agent_app = workflow.compile()

