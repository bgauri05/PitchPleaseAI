"""
Firebase Admin SDK — singleton accessor, mirrors services/supabase.py's pattern.

─────────────────────────────────────────────────────────────────────────────
WHAT
    Server-side-only Firebase access: verifying ID tokens sent by the
    frontend, and setting custom claims (specifically `role: authenticated`,
    which Supabase's Third-Party Auth integration requires on every Firebase
    JWT for RLS policies to treat the request as an authenticated user
    rather than anon).

WHY a separate module from services/supabase.py?
    Same lazy-singleton shape (@lru_cache) as get_supabase_client(), but
    kept in core/ alongside security.py since this IS a security primitive
    (token verification) rather than a data-access service.

SECURITY HIGHLIGHTS
    1. The service account key is a real credential (unlike the frontend's
       VITE_FIREBASE_* config, which is safe to ship client-side) — loaded
       only from a gitignored local file path, never hardcoded.
    2. `verify_id_token` is what actually proves a request came from the
       Firebase user it claims to be — the /auth/set-claims endpoint below
       only ever stamps a claim onto the SAME uid the token itself proves,
       never a caller-supplied uid, so one user can never grant claims to
       another.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import json
from functools import lru_cache

import firebase_admin
from firebase_admin import auth as firebase_auth, credentials

from app.core.config import get_settings


@lru_cache(maxsize=1)
def get_firebase_app() -> firebase_admin.App:
    """Return a cached, singleton Firebase Admin app instance.

    Prefers FIREBASE_SERVICE_ACCOUNT_JSON (the full service-account key as a
    JSON string) when set — this is what serverless deployments (Lambda) use,
    since there's no persistent local file to point a path at there. Falls
    back to FIREBASE_SERVICE_ACCOUNT_PATH (a local file path) for local dev.
    """
    settings = get_settings()
    if settings.FIREBASE_SERVICE_ACCOUNT_JSON:
        try:
            cred_data = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
        except json.JSONDecodeError as exc:
            raise RuntimeError(
                "FIREBASE_SERVICE_ACCOUNT_JSON is set but isn't valid JSON — "
                "make sure it's the full, minified contents of the service "
                "account key file (e.g. via `jq -c . file.json`), not a path."
            ) from exc
        cred = credentials.Certificate(cred_data)
    elif settings.FIREBASE_SERVICE_ACCOUNT_PATH:
        cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
    else:
        raise RuntimeError(
            "Neither FIREBASE_SERVICE_ACCOUNT_JSON nor FIREBASE_SERVICE_ACCOUNT_PATH "
            "is set — download a service account key from Firebase Console → "
            "Project settings → Service accounts, then either save it locally "
            "and point FIREBASE_SERVICE_ACCOUNT_PATH at it (local dev), or set "
            "FIREBASE_SERVICE_ACCOUNT_JSON to its full minified contents (Lambda)."
        )
    return firebase_admin.initialize_app(cred)


def verify_firebase_token(id_token: str) -> dict:
    """Verify a Firebase ID token and return its decoded claims.

    Raises `firebase_admin.auth.InvalidIdTokenError` (or a related
    exception) if the token is malformed, expired, or signed by a
    different Firebase project — callers should let that propagate into a
    401, never treat a failed verification as "no claims, proceed anyway."
    """
    get_firebase_app()  # ensures initialized
    return firebase_auth.verify_id_token(id_token)


def set_authenticated_claim(uid: str) -> None:
    """Stamp `role: authenticated` onto this Firebase user.

    Required by Supabase's Firebase third-party-auth integration — RLS
    policies written `to authenticated` only match requests whose JWT
    carries this claim. Idempotent: safe to call on every login.
    """
    get_firebase_app()  # ensures initialized
    firebase_auth.set_custom_user_claims(uid, {"role": "authenticated"})
