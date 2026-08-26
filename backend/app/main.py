"""
FastAPI application factory & entry-point.

─────────────────────────────────────────────────────────────────────────────
WHAT
    Creates the FastAPI app, attaches CORS middleware, registers versioned
    API routers, exposes a root health-check, and wraps everything with
    Mangum for seamless AWS Lambda deployment.

HOW
    • `create_app()` is a **factory function** — tests can call it with
      overridden settings via dependency injection for full isolation.
    • CORS origins are read from `Settings.BACKEND_CORS_ORIGINS`.
    • Swagger / ReDoc docs are conditionally exposed based on
      `Settings.ENVIRONMENT`: hidden when `"production"`, visible otherwise.
    • The `Mangum` wrapper translates AWS API Gateway / ALB events into
      ASGI calls so the same FastAPI app runs on Lambda without changes.

WHY factory pattern?
    Decouples "how the app is configured" from "the app object itself",
    making local dev (`uvicorn`), testing (`pytest`), and serverless
    deployment (`Mangum`) all use the exact same code path.

SECURITY HIGHLIGHTS
    1. CORS Middleware
       → Origins are loaded from `BACKEND_CORS_ORIGINS` in config.py.
       → In non-production environments we allow "*" for convenience;
         in production you MUST set explicit origins.
       → WHY: A wildcard in production would let any website issue
         credentialed cross-origin requests on behalf of your users.

    2. Docs hidden in production
       → `docs_url` and `redoc_url` are set to `None` when
         ENVIRONMENT == "production".
       → WHY: Publicly accessible API docs let attackers enumerate every
         endpoint, parameter, and schema without authentication.

    3. Lifespan hooks
       → The `lifespan` context manager runs code once at startup/shutdown.
       → Ideal for warming LLM connections and pre-loading brand memory
         embeddings — avoids cold-start latency on the first request.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum

from app.core.config import get_settings
from app.api.v1.router import api_router
from app.services.scheduler import start_scheduler, stop_scheduler


# ─────────────────────────────────────────────────────────────────────────────
# Lifespan — startup / shutdown hooks
# ─────────────────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Execute code once on startup and once on shutdown.

    WHAT:  A single async context manager that FastAPI calls when the
           server process starts and when it is shutting down.
    HOW:   Everything before `yield` runs at startup; everything after
           runs at shutdown.
    WHY:   Perfect for:
             • Warming LLM connections / Supabase client pools
             • Preloading brand-memory embeddings into cache
             • Gracefully closing database connections on shutdown
    """
    settings = get_settings()
    # --- startup ---
    print(f"[START] {settings.PROJECT_NAME} v{settings.APP_VERSION} starting "
          f"[env={settings.ENVIRONMENT}] …")
    start_scheduler()
    yield
    # --- shutdown ---
    stop_scheduler()
    print("[SHUTDOWN] Shutting down …")


# ─────────────────────────────────────────────────────────────────────────────
# Application factory
# ─────────────────────────────────────────────────────────────────────────────

def create_app() -> FastAPI:
    """Build and return a fully configured FastAPI application.

    The factory reads all configuration from `get_settings()` so the app
    can be instantiated with different envs in tests.
    """
    settings = get_settings()

    # ── Determine if we are in production ────────────────────
    #    WHAT:  Controls doc visibility and CORS strictness.
    #    HOW:   Compares ENVIRONMENT against the literal "production".
    #    SECURITY:  In production, docs_url and redoc_url are None,
    #               preventing unauthenticated API exploration.
    is_production: bool = settings.ENVIRONMENT.lower() == "production"

    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.APP_VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json" if not is_production else None,
        docs_url="/docs" if not is_production else None,      # Swagger UI
        redoc_url="/redoc" if not is_production else None,     # ReDoc
        lifespan=lifespan,
    )

    # ── CORS Middleware ──────────────────────────────────────
    #    WHAT:  Tells browsers which external origins may call this API.
    #    HOW:   Reads the allow-list from Settings; falls back to "*" in
    #           non-production for local development convenience.
    #    SECURITY:
    #      • Production deployments MUST set BACKEND_CORS_ORIGINS to the
    #        exact frontend domain(s).
    #      • `allow_credentials=True` enables cookies / Authorization
    #        headers — this REQUIRES a specific origin list (not "*")
    #        per the CORS spec; browsers will reject it otherwise.
    origins = settings.BACKEND_CORS_ORIGINS
    if not is_production and not origins:
        origins = ["*"]                 # convenience for local dev only

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,          # list of permitted origins
        allow_credentials=True,         # allow cookies / auth headers
        allow_methods=["*"],            # permit all HTTP methods
        allow_headers=["*"],            # accept any custom header
    )

    # ── Register versioned API routers ───────────────────────
    #    All v1 routes live under /api/v1/…
    app.include_router(api_router, prefix=settings.API_V1_STR)

    # ── Static uploads directory ─────────────────────────────
    import os
    from fastapi.staticfiles import StaticFiles
    uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    os.makedirs(uploads_dir, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")


    # ── Root health-check endpoint ───────────────────────────
    #    WHAT:  A minimal GET / that returns {"status": "alive"}.
    #    WHY:   Load balancers, Docker HEALTHCHECK, and uptime monitors
    #           hit this endpoint to confirm the process is responsive.
    #           Placed at the root so it works even if the /api/v1 prefix
    #           is misconfigured.
    @app.get(
        "/",
        tags=["health"],
        summary="Root health check — verify the API is running",
    )
    async def root_health_check():
        return {
            "status": "healthy",
            "project": settings.PROJECT_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "docs": "/docs",
        }

    return app


# ─────────────────────────────────────────────────────────────────────────────
# Module-level instances
# ─────────────────────────────────────────────────────────────────────────────

#   `app`     — used by `uvicorn app.main:app --reload`
#   `handler` — used by AWS Lambda via Mangum
app = create_app()  # Reloaded with new Meta App credentials 925067427319541

# WHAT:  Mangum wraps the ASGI FastAPI app so AWS Lambda can invoke it.
# HOW:   API Gateway / ALB sends an event dict → Mangum converts it into
#        an ASGI scope → FastAPI processes it → Mangum converts the ASGI
#        response back into a Lambda-compatible dict.
# WHY:   Lets you deploy the exact same codebase to Lambda without writing
#        any Lambda-specific handler code.
# NOTE:  `lifespan="off"` because Lambda manages process lifecycle itself;
#        the lifespan hooks are meant for long-running uvicorn processes.
handler = Mangum(app, lifespan="off")
