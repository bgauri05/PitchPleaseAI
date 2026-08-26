"""
Health-check endpoint (versioned, under /api/v1).

WHAT:  A lightweight `GET /api/v1/health` that returns HTTP 200 + metadata.
       Used by load balancers, Docker HEALTHCHECK, and uptime monitors
       to confirm the service is alive.

NOTE:  A second health-check lives at the root `/` (defined in main.py)
       for infrastructure probes that don't know the versioned prefix.
"""

from __future__ import annotations

from fastapi import APIRouter

from app.core.config import get_settings

router = APIRouter()


@router.get("/health")
async def health_check():
    s = get_settings()
    return {
        "status": "healthy",
        "project": s.PROJECT_NAME,
        "version": s.APP_VERSION,
        "environment": s.ENVIRONMENT,
    }
