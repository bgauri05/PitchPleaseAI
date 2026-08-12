"""
Brand Memory Service — RAG (Retrieval-Augmented Generation) layer built on
Supabase pgvector and LangChain.

─────────────────────────────────────────────────────────────────────────────
WHAT
    Two public async functions that agents call to:
      • `add_brand_guideline`    — embed and store brand rules / past posts.
      • `retrieve_brand_context` — similarity-search and return a Markdown
                                   string ready to inject into LangGraph state.

HOW — Vector store architecture
    ┌─────────────────────────────────────────────────────────────┐
    │  Input text                                                 │
    │      ↓                                                      │
    │  HuggingFaceEmbeddings  (all-MiniLM-L6-v2, 384 dims)      │
    │      ↓   float32 vector of length 384                      │
    │  SupabaseVectorStore ──▶ pgvector extension in Supabase    │
    │      • table  : brand_memory                                │
    │      • fn     : match_brand_memory  (cosine similarity)     │
    └─────────────────────────────────────────────────────────────┘

HOW — Supabase schema (expected, must be created via migration):
    CREATE TABLE brand_memory (
        id          BIGSERIAL PRIMARY KEY,
        content     TEXT,
        metadata    JSONB,
        embedding   VECTOR(384)         -- matches all-MiniLM-L6-v2 output
    );

    CREATE OR REPLACE FUNCTION match_brand_memory(
        query_embedding VECTOR(384),
        match_count     INT DEFAULT 3
    )
    RETURNS TABLE (id BIGINT, content TEXT, metadata JSONB, similarity FLOAT)
    LANGUAGE SQL STABLE AS $$
        SELECT id, content, metadata,
               1 - (embedding <=> query_embedding) AS similarity
        FROM   brand_memory
        ORDER  BY embedding <=> query_embedding
        LIMIT  match_count;
    $$;

WHY RAG for brand memory?
    • Brand guidelines, tone-of-voice rules, and past high-performing posts
      can be thousands of words — too long to include wholesale in every
      LLM prompt.
    • Embedding + similarity search lets agents fetch ONLY the 3–5 most
      relevant brand snippets for a given topic, keeping prompts concise
      and focused.
    • Storing in Supabase (pgvector) means the memory persists across
      process restarts and is shared across all server instances.

WHY `all-MiniLM-L6-v2`?
    • 384-dimensional output — compact enough for fast cosine-search while
      retaining strong semantic quality on short-to-medium texts.
    • Runs entirely CPU-side with no external API call — zero latency added
      per embedding and no additional API key required.
    • Widely benchmarked; available via the `sentence-transformers` package
      which `langchain-huggingface` wraps.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import logging
from typing import Dict, List, Optional

from langchain_huggingface import HuggingFaceEmbeddings      # pip install langchain-huggingface
from langchain_community.vectorstores import SupabaseVectorStore  # pip install langchain-community

from app.services.supabase import get_supabase_client

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Embedding model — initialised ONCE at module import time
# ─────────────────────────────────────────────────────────────────────────────

# WHAT:  `HuggingFaceEmbeddings` downloads the all-MiniLM-L6-v2 model from
#        Hugging Face Hub on first use and caches it locally.
# HOW:   It wraps `sentence-transformers` under the hood, running inference
#        on CPU by default (or GPU if CUDA is available).
# WHY module-level (not inside the function)?
#        Loading the model involves reading ~90 MB of weights from disk.
#        Doing it once at import time means every subsequent call to
#        `get_vector_store()` reuses the already-loaded model — avoids
#        ~500 ms of cold-start per request.
# WHY 384 dimensions?
#        all-MiniLM-L6-v2 always produces vectors of exactly 384 float32
#        values.  The `embedding VECTOR(384)` column in the `brand_memory`
#        Supabase table MUST match this dimension exactly — a mismatch
#        causes a pgvector insertion error.
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


# ─────────────────────────────────────────────────────────────────────────────
# Vector store accessor
# ─────────────────────────────────────────────────────────────────────────────

def get_vector_store() -> SupabaseVectorStore:
    """Return a configured SupabaseVectorStore pointing at our brand_memory table.

    WHAT:  Wires together three components:
             1. Supabase `Client`       — the pooled HTTP client (singleton).
             2. `embeddings`            — the module-level MiniLM model.
             3. Table / function names  — tells LangChain where to store and
                                          query vectors in Supabase.

    HOW:   `SupabaseVectorStore` from `langchain_community` translates
           LangChain's standard vector-store interface into Supabase REST API
           calls:
             • `add_texts()`        → POST to /rest/v1/brand_memory
             • `similarity_search() → POST to /rest/v1/rpc/match_brand_memory

    WHY `query_name="match_brand_memory"`?
           Supabase's pgvector integration requires a SQL function that
           accepts a query embedding vector and returns ranked rows.  The
           function name must match the one created in the migration
           (see module docstring above).  LangChain calls this RPC endpoint
           automatically during similarity_search().

    Returns
    -------
    SupabaseVectorStore
        Ready-to-use vector store instance.
    """
    # WHAT:  Grab the singleton Supabase client (see services/supabase.py).
    # WHY not create a new client here?  Connection-pool efficiency — the
    #        same pooled HTTP session is reused across all vector store ops.
    client = get_supabase_client()

    return SupabaseVectorStore(
        client=client,
        embedding=embeddings,        # the module-level MiniLM model
        table_name="brand_memory",   # Supabase table that stores embeddings
        query_name="match_brand_memory",  # SQL RPC function for similarity search
    )


# ─────────────────────────────────────────────────────────────────────────────
# Public async functions
# ─────────────────────────────────────────────────────────────────────────────

async def add_brand_guideline(
    business_id: str,
    content: str,
    metadata: Optional[Dict] = None,
) -> bool:
    """Embed and persist a brand guideline, scoped to a specific business."""
    try:
        client = get_supabase_client()

        # Embed the text directly (384-dim vector), bypassing the LangChain
        # wrapper here — SupabaseVectorStore.add_texts() only knows about
        # content/metadata/embedding columns, not our added business_id
        # column, so it can't satisfy the NOT NULL constraint we added.
        vector = embeddings.embed_query(content)

        client.table("brand_memory").insert({
            "business_id": business_id,
            "content": content,
            "metadata": metadata or {},
            "embedding": vector,
        }).execute()

        logger.info(
            "Brand guideline stored | business_id=%s chars=%d",
            business_id, len(content),
        )
        return True

    except Exception as exc:
        logger.error("Failed to store brand guideline | error=%s", exc, exc_info=True)
        return False

async def get_business_profile(business_id: str) -> Optional[Dict]:
    """Fetch structured business attributes from businesses table."""
    try:
        res = get_supabase_client().table("businesses").select("*").eq("id", business_id).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
    except Exception as exc:
        logger.warning("Could not fetch business profile for business_id=%s | %s", business_id, exc)
    return None


async def upsert_business_profile(payload: Dict) -> Optional[Dict]:
    """Create or update a Business Brand Memory profile in Supabase table."""
    try:
        res = get_supabase_client().table("businesses").upsert(payload).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        return payload
    except Exception as exc:
        logger.error("Failed to upsert business profile | error=%s", exc, exc_info=True)
        return payload


async def update_business_profile(business_id: str, updates: Dict) -> Optional[Dict]:
    """Update specific fields of an existing Business Brand Memory profile."""
    try:
        updates["updated_at"] = "now()"
        res = get_supabase_client().table("businesses").update(updates).eq("id", business_id).execute()
        if res.data and len(res.data) > 0:
            return res.data[0]
        return await get_business_profile(business_id)
    except Exception as exc:
        logger.error("Failed to update business profile for business_id=%s | error=%s", business_id, exc, exc_info=True)
        return None



async def retrieve_brand_context(query: str, business_id: str, k: int = 3) -> str:
    """Retrieve the complete Brand Memory (structured profile + vector guidelines) for a query.

    Combines:
      1. Structured Brand Memory profile (Business Info, Brand Voice, Brand Values,
         Target Audience, Products/Services, and Custom AI Instructions).
      2. Semantic vector search snippets from pgvector `brand_memory` table.
    """
    sections: List[str] = []

    # Step 0 — Fetch structured Business Brand Memory profile
    profile = await get_business_profile(business_id)
    if profile:
        name = profile.get("business_name") or profile.get("name") or "Business"
        industry = profile.get("industry") or "General"
        desc = profile.get("business_description") or ""

        # Voice & Values formatting
        voice_val = profile.get("brand_voice")
        if isinstance(voice_val, list):
            voice_str = ", ".join(voice_val)
        else:
            voice_str = str(voice_val) if voice_val else profile.get("tone", "Professional")

        values_val = profile.get("brand_values")
        if isinstance(values_val, list):
            values_str = ", ".join(values_val)
        else:
            values_str = str(values_val) if values_val else ""

        audience = profile.get("target_audience") or ""
        products = profile.get("products_services") or ""
        ai_instructions = profile.get("ai_instructions") or ""

        profile_lines = [
            "## 🏢 Core Brand Identity & Memory",
            f"- **Business Name**: {name}",
            f"- **Industry**: {industry}",
        ]
        if desc:
            profile_lines.append(f"- **Business Description**: {desc}")
        if voice_str:
            profile_lines.append(f"- **Brand Voice**: {voice_str}")
        if values_str:
            profile_lines.append(f"- **Brand Values**: {values_str}")
        if audience:
            profile_lines.append(f"- **Target Audience**: {audience}")
        if products:
            profile_lines.append(f"- **Products / Services**: {products}")
        if ai_instructions:
            profile_lines.append(
                f"\n⚠️ **PERSISTENT AI INSTRUCTIONS (MUST ALWAYS FOLLOW)**:\n{ai_instructions}"
            )

        sections.append("\n".join(profile_lines))

    try:
        # Step 1 — Embed query directly with MiniLM
        query_embedding: List[float] = embeddings.embed_query(query)

        # Step 2 — Call Supabase RPC function for similarity search
        response = (
            get_supabase_client()
            .rpc(
                "match_brand_memory",
                {
                    "query_embedding": query_embedding,
                    "match_count": k,
                    "filter_business_id": business_id,
                },
            )
            .execute()
        )

        rows = response.data or []
        if rows:
            memory_sections: List[str] = []
            for i, row in enumerate(rows, start=1):
                metadata: Dict = row.get("metadata") or {}
                source: str = metadata.get("source", f"guideline-{i}")
                content: str = (row.get("content") or "").strip()
                memory_sections.append(
                    f"### Brand Guideline [{i}] — {source}\n{content}"
                )
            sections.append("## 📚 Vector Brand Knowledge\n" + "\n\n".join(memory_sections))

        context = "\n\n---\n\n".join(sections)
        logger.info(
            "Retrieved brand memory for business_id=%s query=%r | chars=%d",
            business_id, query, len(context),
        )
        return context

    except Exception as exc:
        logger.error(
            "Failed to retrieve vector brand context | query=%r error=%s",
            query, exc, exc_info=True,
        )
        return "\n\n---\n\n".join(sections) if sections else ""


