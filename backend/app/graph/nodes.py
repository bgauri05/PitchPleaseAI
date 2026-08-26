"""
LangGraph node functions — thin wrappers that call agent.run(state).

WHAT:  Each function below is a LangGraph "node".  It instantiates its agent,
       calls `agent.run(state)`, and returns the partial state update.

HOW:   Nodes receive the full GraphState, delegate work to the agent, and
       return **only the keys they change** (LangGraph merges the rest).

WHY:   Keeping nodes as thin adapters means all business logic lives inside
       the Agent classes, which are independently testable.
"""

from __future__ import annotations

import json
from typing import Any, Dict

from app.agents.researcher import ResearcherAgent
from app.agents.creator import CreatorAgent
from app.agents.sentinel import SentinelAgent
from app.core.llm import get_groq_llm


async def researcher_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """LangGraph node — runs the Researcher agent.

    Reads:  state["request"]  (ContentRequest)
    Writes: state["research_context"]  (Markdown research brief)
    """
    agent = ResearcherAgent(llm=get_groq_llm())
    return await agent.run(state)


async def creator_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """LangGraph node — runs the Creator agent.

    Reads:  state["request"], state["research_context"],
            state["sentinel_feedback"] (on revision loops)
    Writes: state["current_drafts"]  (dict of platform → draft text)
    """
    agent = CreatorAgent(llm=get_groq_llm())
    return await agent.run(state)


async def sentinel_node(state: Dict[str, Any]) -> Dict[str, Any]:
    """LangGraph node — runs the Sentinel agent, sets approval flag.

    Reads:  state["request"], state["current_drafts"]
    Writes: state["sentinel_feedback"], state["is_approved"],
            state["loop_count"]
    """
    agent = SentinelAgent(llm=get_groq_llm())
    result = await agent.run(state)

    # Parse verdict to set the boolean control flag
    is_approved = False
    try:
        feedback = result.get("sentinel_feedback", "{}")
        review_data = json.loads(feedback)
        is_approved = review_data.get("verdict", "").lower() == "approved"
    except (json.JSONDecodeError, AttributeError):
        pass

    return {
        **result,
        "is_approved": is_approved,
        "loop_count": state.get("loop_count", 0) + 1,
    }
