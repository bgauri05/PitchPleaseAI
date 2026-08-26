"""
v1 API router — collects all endpoint sub-routers under the /api/v1 prefix.

─────────────────────────────────────────────────────────────────────────────
WHAT
    A top-level `APIRouter` that mounts every endpoint module under the
    `/api/v1/…` namespace.  `main.py` imports ONLY this router so the
    application factory never needs to know about individual endpoint files.

HOW
    Each endpoint module (health, content, …) exposes its own `router`
    object.  We include those sub-routers here with their own prefix and tag,
    which FastAPI merges into the main app when `api_router` is included.

WHY versioned router?
    When v2 ships, we add `app/api/v2/router.py` and include it alongside
    this one in main.py — zero changes to v1 code required.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

from fastapi import APIRouter

from app.api.v1.endpoints import auth, business, content, health, instagram, schedule

# WHAT:  The single router object imported by main.py.
# HOW:   main.py calls `app.include_router(api_router, prefix=settings.API_V1_STR)`
#        which mounts every sub-router at /api/v1/<sub-prefix>/…
api_router = APIRouter()

# ── Health endpoints ──────────────────────────────────────────────────
# Final path: GET /api/v1/health  (no sub-prefix needed for a single route)
api_router.include_router(health.router, tags=["Health"])

# ── Content-generation endpoints ────────────────────────────────────────
# Final path: POST /api/v1/content/generate
api_router.include_router(
    content.router,
    prefix="/content",
    tags=["Content Generation"],
)

# ── Business setup endpoints ──────────────────────────────────────────
# Final path: POST /api/v1/business/setup
api_router.include_router(
    business.router,
    prefix="/business",
    tags=["Business Setup"],
)

# ── Instagram OAuth endpoints ─────────────────────────────────────────
# Final path: GET /api/v1/instagram/connect & GET /api/v1/instagram/callback
api_router.include_router(
    instagram.router,
    prefix="/instagram",
    tags=["Instagram"],
)

# ── Schedule endpoints ────────────────────────────────────────────────
# Final path: POST /api/v1/schedule & GET /api/v1/schedule
api_router.include_router(
    schedule.router,
    prefix="/schedule",
    tags=["Schedule"],
)

# ── Firebase auth support endpoints ─────────────────────────────────────
# Final path: POST /api/v1/auth/set-claims
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Auth"],
)
