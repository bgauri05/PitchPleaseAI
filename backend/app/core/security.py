"""
Security utilities — API-key validation and future auth helpers.

─────────────────────────────────────────────────────────────────────────────
WHAT
    Houses every security-related helper so they live in ONE auditable file
    rather than scattered across routers and middleware.

HOW
    • `verify_api_key` is a FastAPI **Dependency** — inject it into any
      route with `Depends(verify_api_key)` and the framework handles the
      rest (header extraction, error response, OpenAPI schema).
    • We use `fastapi.security.APIKeyHeader` which:
      ① reads the `X-API-Key` HTTP header automatically, and
      ② adds a "lock" icon + auth input to the Swagger /docs UI so
         developers can test protected routes interactively.

WHY this file?
    Centralising security code means auditing one file to review the entire
    authentication surface instead of hunting through dozens of routers.

SECURITY HIGHLIGHTS
    1. APIKeyHeader (header-only extraction)
       → The key is read from a custom HTTP **header**, never from query
         strings or URL path segments.
       → WHY: Query params appear in browser history, server access logs,
         and CDN caches.  Headers do not.

    2. Constant-time comparison (secrets.compare_digest)
       → WHAT: Compares the client-supplied key against the server secret
         in a way that always takes the same amount of time regardless of
         how many characters match.
       → HOW: Under the hood, Python's `secrets.compare_digest` XORs every
         byte and accumulates a result — it does NOT short-circuit on the
         first mismatch.
       → WHY: A naive `==` returns faster when the first character differs
         than when only the last character differs.  An attacker can measure
         these tiny timing differences to guess the key one character at a
         time ("timing side-channel attack").  Constant-time comparison
         eliminates this vector entirely.

    3. SecretStr server-side storage
       → The expected API key lives in `Settings.API_KEY` as a Pydantic
         SecretStr — it never appears in logs, tracebacks, or JSON.

    4. Fail-closed design
       → If the header is missing OR the comparison fails, the function
         raises HTTP 403 **immediately**.  No downstream code executes.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import secrets

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader

from app.core.config import Settings, get_settings


# ─────────────────────────────────────────────────────────────────────────────
# APIKeyHeader scheme
# ─────────────────────────────────────────────────────────────────────────────
#   WHAT:  A FastAPI "security scheme" that tells the framework to look for
#          an `X-API-Key` header on incoming requests.
#   HOW:   `auto_error=False` means WE handle the missing-header case
#          ourselves (so we can return a clear 403 instead of a generic 422).
#   WHY:   Using the official security scheme also registers the auth
#          requirement in the OpenAPI spec, so Swagger UI shows a padlock
#          and an input field for the key.
# ─────────────────────────────────────────────────────────────────────────────
_api_key_header = APIKeyHeader(
    name="X-API-Key",                   # exact header name clients must send
    auto_error=False,                   # let us raise our own HTTPException
)


# ─────────────────────────────────────────────────────────────────────────────
# Dependency — inject into any route with  Depends(verify_api_key)
# ─────────────────────────────────────────────────────────────────────────────

async def verify_api_key(
    api_key: str | None = Security(_api_key_header),
    settings: Settings = Depends(get_settings),
) -> str:
    """Validate the `X-API-Key` request header and return it on success.

    Parameters
    ----------
    api_key : str | None
        Value extracted from the X-API-Key header by APIKeyHeader.
        Will be None if the client omitted the header entirely.
    settings : Settings
        Injected application settings (provides the expected API key).

    Returns
    -------
    str
        The validated API key (useful if downstream code needs it).

    Raises
    ------
    HTTPException (403)
        If the header is missing or does not match the server secret.

    Implementation walkthrough
    --------------------------
    1. Retrieve the expected key from `settings.API_KEY` using
       `.get_secret_value()` — this is the ONLY place the raw secret is
       ever materialised in memory.
    2. Guard: if the client sent no header, reject immediately.
    3. Compare the two strings with `secrets.compare_digest`:
       • Both values are encoded to bytes first (required by the function).
       • The comparison runs in constant time — see SECURITY HIGHLIGHT #2
         in the module docstring.
    4. On mismatch, raise 403 with a generic message.  We intentionally
       do NOT reveal whether the header was missing vs. wrong — that would
       help an attacker distinguish the two failure modes.
    """
    # ── Step 1: extract the expected key from Settings ───────
    expected_key: str = settings.API_KEY.get_secret_value()

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing API key.",
        )

    # ── Step 3: constant-time comparison ─────────────────────
    keys_match: bool = secrets.compare_digest(
        api_key.encode("utf-8"),
        expected_key.encode("utf-8"),
    )

    # ── Step 4: reject invalid key ───────────────────────────
    if not keys_match:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid or missing API key.",
        )

    return api_key
