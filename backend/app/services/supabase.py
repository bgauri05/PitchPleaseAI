"""
Supabase Database Client — singleton accessor for the Supabase Python SDK.

─────────────────────────────────────────────────────────────────────────────
WHAT
    A lazily-initialised, cached Supabase `Client` used for every database
    operation in the application:
      • Brand-memory CRUD  (profiles, tone-of-voice docs, content history)
      • Vector similarity search  (pgvector extension via Supabase)
      • Row-Level Security (RLS) bypass  (service-role key grants full access)
      • Auth token verification  (future — validate JWTs server-side)

HOW  — Singleton Pattern via @lru_cache
    `get_supabase_client()` is decorated with `@lru_cache(maxsize=1)`.
    The first call creates a `Client`, and every subsequent call returns the
    **same** cached instance.

WHY a singleton?
    During a high-throughput LangGraph cycle a single user request can
    trigger dozens of DB round-trips (read brand profile → fetch past
    content → store new drafts → update analytics).  If each call created
    a brand-new HTTP client, we would:
      1. Exhaust the OS's ephemeral-port / socket pool under load.
      2. Re-negotiate TLS on every request — unnecessary latency.
      3. Risk hitting Supabase's per-project connection limits.
    A single instanced client keeps one persistent HTTP session alive,
    reuses its connection pool, and eliminates all three problems.

SECURITY HIGHLIGHTS
    1. The Supabase key is stored as a Pydantic `SecretStr` in Settings.
       `.get_secret_value()` extracts the raw string only here — it never
       appears in logs, repr(), or FastAPI's /docs schema.
    2. The service-role key **bypasses RLS**, so this client is strictly
       server-side.  NEVER expose it to frontend code.
    3. The client is created lazily (on first call, not at import time),
       preventing import-time crashes in environments where Supabase
       isn't configured (e.g. unit tests with mocked dependencies).
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

from functools import lru_cache

# `create_client` — factory shipped by the official `supabase` Python SDK.
# `Client`        — the type of the object it returns; used for type hints.
from supabase import create_client, Client      # pip install supabase

from app.core.config import get_settings


# ─────────────────────────────────────────────────────────────────────────────
# Singleton accessor
# ─────────────────────────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def get_supabase_client() -> Client:
    """Return a cached, singleton Supabase client.

    The client is built from two values pulled out of our centralised
    `Settings` object:
      • SUPABASE_URL — the full HTTPS URL of the Supabase project
        (e.g. ``https://xyz.supabase.co``).
      • SUPABASE_KEY — the service-role (or anon) key.  Because it is
        declared as ``SecretStr`` in Settings, we call
        ``.get_secret_value()`` to obtain the raw string.

    Returns
    -------
    Client
        A ready-to-use Supabase client that can call
        ``client.table(...).select(...)``, ``client.rpc(...)``, etc.

    Notes
    -----
    • Thread-safety: the underlying ``httpx`` transport used by the
      Supabase SDK is thread-safe, so sharing one client across
      FastAPI's async workers is perfectly fine.
    • To reset the cached client (e.g. in tests), call
      ``get_supabase_client.cache_clear()``.
    """

    # ── Load validated settings (singleton, cached by its own lru_cache) ──
    settings = get_settings()

    # ── Build and return the Supabase client ─────────────────
    #    WHAT:  `create_client` opens an HTTPS session to the Supabase
    #           project and authenticates with the provided key.
    #    HOW:   The key is extracted via `.get_secret_value()` — the only
    #           place in the entire codebase where the raw key is exposed.
    #    WHY:   Every downstream service (brand_memory, content CRUD, etc.)
    #           imports this function and shares the same pooled connection.
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_KEY.get_secret_value(),
    )
