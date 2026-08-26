"""
Instagram OAuth connect flow.

WHAT: Lets a business connect their Instagram Business account so we can
      publish scheduled posts on their behalf later.
HOW:  Standard OAuth 2.0 authorization-code flow via Facebook Login, since
      Instagram Graph API auth routes through Facebook's login system —
      Instagram publishing permissions attach to a Facebook Page, not
      directly to an Instagram account.
WHY:  A stored access token (not a password) is the only way an app is
      allowed to post on a user's behalf.

STATUS: Untested skeleton. Cannot run until a real Meta Developer App
        exists (App ID/Secret) — see auto-posting plan, step 1. Scope
        names and endpoint paths should be re-verified against Meta's
        current docs before the first real test; these details change.
"""
from __future__ import annotations

import httpx
from fastapi import APIRouter, HTTPException, Query
from starlette.responses import RedirectResponse

from app.core.config import settings
from app.services.supabase import get_supabase_client

router = APIRouter()

FACEBOOK_OAUTH_DIALOG = "https://www.facebook.com/v21.0/dialog/oauth"
FACEBOOK_TOKEN_URL = "https://graph.facebook.com/v21.0/oauth/access_token"
FACEBOOK_GRAPH_URL = "https://graph.facebook.com/v21.0"

REQUIRED_SCOPES = "instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement"


@router.get("/connect")
def connect_instagram(business_id: str = Query(...)):
    """Step 1: redirect the business owner to Facebook's consent screen.
    `business_id` rides along as `state` so the callback knows whose row
    to update once Facebook redirects back."""
    params = {
        "client_id": settings.META_APP_ID,
        "redirect_uri": settings.META_REDIRECT_URI,
        "state": business_id,
        "scope": REQUIRED_SCOPES,
        "response_type": "code",
    }
    if settings.META_CONFIG_ID:
        params["config_id"] = settings.META_CONFIG_ID
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(f"{FACEBOOK_OAUTH_DIALOG}?{query}")



@router.get("/callback")
async def instagram_callback(code: str = Query(...), state: str = Query(...)):
    """Step 2: exchange the one-time code for a long-lived token, find the
    Instagram Business Account linked to the user's Facebook Page, and
    store both on the business's row."""
    business_id = state

    async with httpx.AsyncClient() as client:
        short_lived = await client.get(FACEBOOK_TOKEN_URL, params={
            "client_id": settings.META_APP_ID,
            "client_secret": settings.META_APP_SECRET.get_secret_value(),
            "redirect_uri": settings.META_REDIRECT_URI,
            "code": code,
        })
        if short_lived.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange code for token")
        short_lived_token = short_lived.json()["access_token"]

        long_lived = await client.get(FACEBOOK_TOKEN_URL, params={
            "grant_type": "fb_exchange_token",
            "client_id": settings.META_APP_ID,
            "client_secret": settings.META_APP_SECRET.get_secret_value(),
            "fb_exchange_token": short_lived_token,
        })
        long_lived_token = long_lived.json()["access_token"]

        pages_resp = await client.get(f"{FACEBOOK_GRAPH_URL}/me/accounts", params={
            "access_token": long_lived_token,
        })
        pages = pages_resp.json().get("data", [])
        if not pages:
            raise HTTPException(status_code=400, detail="No Facebook Page found for this account")

        page_id = pages[0]["id"]
        ig_resp = await client.get(f"{FACEBOOK_GRAPH_URL}/{page_id}", params={
            "fields": "instagram_business_account",
            "access_token": long_lived_token,
        })
        ig_account = ig_resp.json().get("instagram_business_account")
        if not ig_account:
            raise HTTPException(
                status_code=400,
                detail="This Facebook Page has no linked Instagram Business account",
            )
        ig_user_id = ig_account["id"]

    from datetime import datetime, timezone

    get_supabase_client().table("businesses").update({
        "instagram_access_token": long_lived_token,
        "instagram_user_id": ig_user_id,
        "instagram_token_updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", business_id).execute()

    return {"status": "connected", "instagram_user_id": ig_user_id}
