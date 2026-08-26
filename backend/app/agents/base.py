"""
Base Agent — abstract contract that every BrandSetu agent implements.

WHAT:  Defines the interface (`run`) that the LangGraph orchestration layer
       calls uniformly, regardless of which concrete agent is behind it.

WHY:   Enforcing a common interface means the graph nodes can invoke any
       agent polymorphically — swapping / adding agents later requires no
       changes to the graph wiring.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict

from langchain_core.language_models.chat_models import BaseChatModel


class BaseAgent(ABC):
    """Abstract base class for all BrandSetu agents."""

    def __init__(self, llm: BaseChatModel) -> None:
        self.llm = llm

    @abstractmethod
    async def run(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the agent's task and return an updated state dict.

        Parameters
        ----------
        state : dict
            The current LangGraph state passed between nodes.

        Returns
        -------
        dict
            Updated state (only the keys this agent is responsible for).
        """
        ...
