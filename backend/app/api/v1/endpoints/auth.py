"""
Firebase auth support endpoints.

─────────────────────────────────────────────────────────────────────────────
WHAT
    A single POST /auth/set-claims route, called by the frontend right
    after signup/login, that stamps the `role: authenticated` custom claim
    onto the calling Firebase user — required for Supabase's RLS policies
    (written `to authenticated`) to trust requests carrying that user's ID
    token. See core/firebase_admin.py and Frontend/src/app/pages/AuthPage.tsx.

SECURITY HIGHLIGHTS
    1. The uid that gets the claim is taken from the VERIFIED token itself
       (`decoded['uid']`), never from anything the client could put in the
       request body — a caller can only ever grant the claim to themselves.
    2. `Depends(verify_api_key)` still applies (same X-API-Key gate as every
       other endpoint) — this is defense in depth, not the primary check;
       the primary check is the Firebase token verification itself.
    3. A missing/invalid/expired Authorization header fails closed (401),
       same fail-closed posture as verify_api_key in security.py.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.core.security import verify_api_key
from app.core.firebase_admin import verify_firebase_token, set_authenticated_claim

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/set-claims",
    summary="Grant the Firebase `authenticated` claim to the calling user",
    description=(
        "Called once right after Firebase sign-up/sign-in. Verifies the "
        "caller's own Firebase ID token (Authorization: Bearer <token>) and "
        "stamps `role: authenticated` on that same uid — required for "
        "Supabase RLS policies to recognize the user. Requires a valid "
        "`X-API-Key` header, same as every other endpoint."
    ),
)
async def set_claims(
    authorization: str | None = Header(default=None),
    _: str = Depends(verify_api_key),
) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header — expected 'Bearer <firebase-id-token>'.",
        )

    id_token = authorization.split(" ", 1)[1].strip()

    try:
        decoded = verify_firebase_token(id_token)
    except Exception as exc:
        logger.warning("Firebase token verification failed | error=%s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired Firebase ID token.",
        )

    uid = decoded["uid"]
    try:
        set_authenticated_claim(uid)
    except Exception as exc:
        logger.error("Failed to set Firebase custom claim | uid=%s error=%s", uid, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to grant claim. Try logging in again.",
        )

    logger.info("Granted 'authenticated' claim | uid=%s", uid)
    return {"status": "ok", "uid": uid}
