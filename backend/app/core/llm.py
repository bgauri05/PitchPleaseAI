"""
LLM Provider Factory — returns a primary (Groq) or fallback (AWS Bedrock) chat model.

─────────────────────────────────────────────────────────────────────────────
WHAT
    A single factory function (`get_llm`) that instantiates LangChain
    chat-model objects.  All API keys are read from the `Settings` singleton
    via `.get_secret_value()`, so **no secret is ever hard-coded**.

HOW  — Factory Pattern
    The caller passes a `model_role` string ("primary" or "fallback") and
    receives back a fully-configured LangChain `BaseChatModel`.  Internally
    the function branches to the right provider class.

    This pattern gives us:
      1. A single import / call-site for every LangGraph agent node.
      2. Easy A/B experimentation — just flip the role string.
      3. Resilience — if Groq rate-limits or goes down, any agent can
         request the "fallback" role and transparently switch to AWS
         Bedrock without changing any prompt or chain logic.

WHY two providers?
    • Groq   → Ultra-fast inference on custom LPU silicon; ideal for the
                latency-sensitive content-generation loop.
    • Bedrock → Highly available, enterprise-grade AWS infra running
                Anthropic Claude / Amazon Titan models; acts as the
                safety net when the primary API is unavailable.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations
import os

from langchain_core.language_models.chat_models import BaseChatModel
from langchain_groq import ChatGroq        # pip install langchain-groq
from langchain_aws import ChatBedrock      # pip install langchain-aws

from app.core.config import get_settings


# ─────────────────────────────────────────────────────────────────────────────
# Public factory
# ─────────────────────────────────────────────────────────────────────────────

def get_llm(model_role: str = "primary") -> BaseChatModel:
    """Return a configured LangChain chat model based on the requested role.

    Parameters
    ----------
    model_role : str, default "primary"
        • ``"primary"``   → Groq  (Llama-3.3-70B, temperature 0.7)
        • ``"secondary"`` → Groq  (Llama-3.1-8B-instant, temperature 0.7)
        • ``"fallback"``  → AWS Bedrock (Claude 3 Haiku) or Secondary Groq fallback

    Returns
    -------
    BaseChatModel
        A LangChain-compatible chat model ready to be plugged into any
        chain, agent, or LangGraph node.
    """

    # ── Load validated settings (singleton, cached) ──────────
    settings = get_settings()

    # ── PRIMARY: Groq Llama-3.3-70B ──────────────────────────
    if model_role == "primary":
        return ChatGroq(
            api_key=settings.GROQ_API_KEY.get_secret_value(),
            model=settings.DEFAULT_GROQ_MODEL,       # "llama-3.3-70b-versatile"
            temperature=0.7,
            max_tokens=settings.LLM_MAX_TOKENS,       # 4096 by default
        )

    # ── SECONDARY: Groq Llama-3.1-8B ─────────────────────────
    if model_role in ("secondary", "fallback_groq"):
        return ChatGroq(
            api_key=settings.GROQ_API_KEY.get_secret_value(),
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=settings.LLM_MAX_TOKENS,
        )

    # ── FALLBACK: AWS Bedrock or Secondary Groq ───────────────
    if model_role == "fallback":
        aws_key = os.getenv("AWS_ACCESS_KEY_ID", getattr(settings, "AWS_ACCESS_KEY_ID", ""))
        # Check if AWS credentials are valid and not placeholder
        if aws_key and "placeholder" not in aws_key.lower() and len(aws_key) > 5:
            try:
                return ChatBedrock(
                    model_id="anthropic.claude-3-haiku-20240307-v1:0",
                    region_name=settings.AWS_DEFAULT_REGION,
                    model_kwargs={
                        "temperature": 0.7,
                        "max_tokens": settings.LLM_MAX_TOKENS,
                    },
                    credentials_profile_name=None,
                )
            except Exception:
                pass

        # Default resilient fallback: secondary Groq model
        return ChatGroq(
            api_key=settings.GROQ_API_KEY.get_secret_value(),
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=settings.LLM_MAX_TOKENS,
        )

    # ── Unknown role ─────────────────────────────────────────
    raise ValueError(
        f"Unknown model_role '{model_role}'. Expected 'primary', 'secondary', or 'fallback'."
    )
