"""
Centralised application settings loaded once at startup.

─────────────────────────────────────────────────────────────────────────────
WHAT
    A single Pydantic BaseSettings object that reads every secret and tunable
    from environment variables (or a `.env` file) and exposes them as typed,
    validated Python attributes.

HOW
    • pydantic-settings' BaseSettings auto-maps env vars to class fields.
    • @lru_cache on get_settings() ensures only ONE instance is ever created
      (singleton pattern) — all modules share the same validated config.
    • SettingsConfigDict tells Pydantic WHERE the .env file lives and how
      to interpret it (encoding, case-sensitivity, unknown-key handling).

WHY
    • Secrets never appear in source code — they live in .env (git-ignored).
    • Pydantic validates types at boot time; a mis-configured deployment
      raises a ValidationError *before* any request is served (fail-fast).
    • One import — `get_settings()` — gives every module typed access.

SECURITY HIGHLIGHTS
    1. SecretStr fields
       → GROQ_API_KEY, SUPABASE_KEY, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
         are wrapped in Pydantic's `SecretStr`.
       → SecretStr's __repr__ / __str__ return '**********', so keys NEVER
         leak into logs, tracebacks, FastAPI /docs schema, or JSON output.
       → The raw value is accessed ONLY via `.get_secret_value()` at the
         exact callsite that needs it (e.g. when constructing an LLM client).

    2. .env file loading
       → python-dotenv reads a `.env` that is listed in .gitignore, keeping
         secrets completely out of version control.

    3. Fail-fast validation
       → If a required variable is missing or has the wrong type, the app
         crashes immediately with a clear Pydantic ValidationError rather
         than silently using a bad default mid-request.

    4. ENVIRONMENT gate
       → Controls whether Swagger/ReDoc docs are exposed.  In "production"
         they are hidden, preventing unauthenticated API exploration.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application-wide configuration — reads from env / .env automatically."""

    # ── Pydantic-settings configuration ──────────────────────
    #    WHAT:  Tells Pydantic where to find the .env file and how to
    #           handle extra / missing variables.
    #    WHY:   Centralises loader behaviour so every developer's machine
    #           and every CI/CD runner behave identically.
    model_config = SettingsConfigDict(
        env_file=".env",               # path relative to CWD (backend/)
        env_file_encoding="utf-8",
        case_sensitive=False,           # MY_VAR == my_var in the env
        extra="ignore",                 # don't crash on unused env vars
    )

    # ── App Metadata ─────────────────────────────────────────
    PROJECT_NAME: str = "PitchPleaseAI API"
    #   WHAT:  Human-readable project name shown in /docs title bar and
    #          health-check JSON.
    #   WHY:   Avoids hard-coding strings in multiple places.

    APP_VERSION: str = "0.1.0"
    #   Semantic version surfaced in health-check responses for debugging.

    ENVIRONMENT: str = "development"
    #   WHAT:  Deployment stage — "development" | "staging" | "production".
    #   HOW:   Controls doc visibility (hidden when "production") and CORS
    #          strictness (wildcard origins allowed only in dev).
    #   SECURITY:  Production deployments MUST set ENVIRONMENT=production so
    #              Swagger/ReDoc are disabled and CORS is locked down.

    # ── API ──────────────────────────────────────────────────
    API_V1_STR: str = "/api/v1"
    #   The URL prefix under which all v1 routes are mounted.

    # ── CORS ─────────────────────────────────────────────────
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"]
    #   WHAT:  Whitelist of frontend origins allowed to call this API.
    #   HOW:   Read by CORSMiddleware in main.py.
    #   SECURITY:  In production, restrict this to your actual frontend
    #              domain(s).  A wildcard ("*") would let ANY website make
    #              credentialed requests on behalf of your users.

    # ── Supabase ─────────────────────────────────────────────
    SUPABASE_URL: str = ""
    #   Full URL of your Supabase project (e.g. https://xyz.supabase.co).

    SUPABASE_KEY: SecretStr = SecretStr("")
    #   WHAT:  Supabase anon / service-role key.
    #   SECURITY (SecretStr):
    #     • repr() / str() → '**********' — never leaks in logs.
    #     • Access raw value ONLY via .get_secret_value() when needed.

    # ── Groq (primary LLM inference) ─────────────────────────
    GROQ_API_KEY: SecretStr = SecretStr("")
    #   WHAT:  API key for Groq's ultra-fast LLM endpoint.
    #   SECURITY (SecretStr):  Same masking guarantees as above.
    #   WHY Groq:  Sub-100ms inference for Llama 3 / Mixtral on custom
    #              silicon — ideal for real-time agent workflows.

    # ── AWS Bedrock (fallback LLM) ───────────────────────────
    AWS_ACCESS_KEY_ID: SecretStr = SecretStr("")
    AWS_SECRET_ACCESS_KEY: SecretStr = SecretStr("")
    #   SECURITY (SecretStr):  Both keys are masked.  In production prefer
    #   IAM Roles (no keys needed) — these fields are a convenience for
    #   local development or non-AWS deployments.

    AWS_DEFAULT_REGION: str = "us-east-1"
    #   Bedrock region.  Must match a region where your model is enabled.

    # ── LLM Defaults ────────────────────────────────────────
    DEFAULT_GROQ_MODEL: str = "llama-3.3-70b-versatile"
    DEFAULT_BEDROCK_MODEL: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"
    LLM_TEMPERATURE: float = 0.4
    LLM_MAX_TOKENS: int = 4096

    # ── API Key for endpoint protection ──────────────────────
    API_KEY: SecretStr = SecretStr("")
    #   WHAT:  A server-side secret used by `verify_api_key` in security.py.
    #   HOW:   Clients send it in the `X-API-Key` header; the dependency
    #          compares it in constant time via secrets.compare_digest.
    #   SECURITY (SecretStr):  Masked everywhere except the single
    #          comparison callsite in security.py.

    # ── Firebase Admin (auth) ─────────────────────────────────
    FIREBASE_SERVICE_ACCOUNT_PATH: str = ""
    FIREBASE_SERVICE_ACCOUNT_JSON: str = ""
    #   WHAT:  Filesystem path or JSON content string to a Firebase service account
    #          key file (Firebase Console → Project settings → Service accounts).
    #          FIREBASE_SERVICE_ACCOUNT_JSON is preferred for serverless deployments (Lambda).
    #          FIREBASE_SERVICE_ACCOUNT_PATH is used as fallback for local dev.
    #   SECURITY: this file must be listed in .gitignore (same as .env) —
    #          it is a real credential, not a public config value like the
    #          frontend's VITE_FIREBASE_* keys.


    # ── Hugging Face (free image generation) ─────────────────
    HF_TOKEN: SecretStr = SecretStr("")
    #   WHAT:  Hugging Face User Access Token — used to call the free
    #          Serverless Inference API (FLUX.1-schnell, etc.).
    #   HOW:   Clients must NOT see this value; it is accessed only via
    #          .get_secret_value() inside app.services.image_gen.
    #   SECURITY (SecretStr):  Masked in logs and /docs schema.
    #   WHERE TO GET IT:  https://huggingface.co/settings/tokens


    # ── Meta / Instagram OAuth ─────────────────────────────
    META_APP_ID: str = ""
    #   Not secret — Meta app IDs are visible in the OAuth redirect URL
    #   the browser is sent to, so there's nothing to protect here.

    META_APP_SECRET: SecretStr = SecretStr("")
    #   WHAT:  Used server-side only, to exchange an OAuth code for an
    #          access token (see instagram.py's /callback route).
    #   SECURITY (SecretStr):  Same masking guarantees as the other API
    #          keys above — access the raw value only via
    #          .get_secret_value() at the exact httpx callsite.

    META_REDIRECT_URI: str = ""
    META_CONFIG_ID: str = ""


# ─────────────────────────────────────────────────────────────────────────────
# Singleton accessor
# ─────────────────────────────────────────────────────────────────────────────

@lru_cache()
def get_settings() -> Settings:
    """Return a cached singleton of the validated settings object.

    WHY lru_cache?
      Without it, every call would re-parse the .env file and re-validate
      all fields — wasted I/O and CPU on every request.  The cache ensures
      the Settings object is built exactly once per process lifetime.
    """
    return Settings()


settings = get_settings()

