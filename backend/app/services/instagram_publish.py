"""
Real Instagram Graph API publish logic — replaces scheduler.py's publish_stub.

WHAT: Given a scheduled_posts row, looks up the owning business's stored
      Instagram credentials (instagram_access_token, instagram_user_id —
      written by the OAuth callback in instagram.py) and publishes the
      post for real via the two-step Instagram Content Publishing flow.
HOW:  1. POST /{ig_user_id}/media with image_url + caption -> creation_id
      2. Poll /{creation_id}?fields=status_code until FINISHED (usually
         near-instant for images, but Meta's own docs recommend polling
         rather than assuming immediate readiness)
      3. POST /{ig_user_id}/media_publish with creation_id -> the live
         post's media id
WHY:  scheduler.py's publish_stub always returned True without calling
      Instagram at all — this is the piece that makes posts actually go
      live. Kept as its own module (not inlined in scheduler.py) so it
      can be unit-tested and swapped out (e.g. Facebook Page posts use a
      different endpoint entirely) without touching the polling loop.

STATUS: Written against Meta's Graph API v21.0 Instagram Content
        Publishing docs. Untested against a live Meta App/account (see
        instagram.py's own STATUS note) — re-verify endpoint paths,
        required scopes, and field names against Meta's current docs
        once a real App ID/Secret exist. These details do shift between
        Graph API versions.
"""
from __future__ import annotations

import asyncio
import logging

import httpx

from app.services.supabase import get_supabase_client

logger = logging.getLogger(__name__)

GRAPH_API_VERSION = "v21.0"
GRAPH_API_BASE = f"https://graph.facebook.com/{GRAPH_API_VERSION}"

# How long to poll a media container for FINISHED before giving up.
# Images are typically near-instant; this budget mostly protects against
# Meta-side hiccups, not normal processing time.
MAX_POLL_ATTEMPTS = 10
POLL_INTERVAL_SECONDS = 3


class InstagramPublishError(Exception):
    """Raised when a post cannot be published to Instagram for any reason."""


async def _get_business_instagram_credentials(business_id: str) -> tuple[str, str]:
    """Look up the stored (access_token, ig_user_id) for a business.

    Raises InstagramPublishError if the business hasn't connected
    Instagram yet (see instagram.py's /connect + /callback routes).
    """
    client = get_supabase_client()
    result = (
        client.table("businesses")
        .select("instagram_access_token, instagram_user_id")
        .eq("id", business_id)
        .maybe_single()
        .execute()
    )
    row = result.data
    if not row or not row.get("instagram_access_token") or not row.get("instagram_user_id"):
        raise InstagramPublishError(
            f"Business {business_id} has not connected an Instagram account yet "
            "(no instagram_access_token / instagram_user_id on file — see "
            "GET /api/v1/instagram/connect)."
        )
    return row["instagram_access_token"], row["instagram_user_id"]


async def publish_to_instagram(post: dict) -> str:
    """Publish *post* (a scheduled_posts row) to Instagram for real.

    Parameters
    ----------
    post : dict
        A row from `scheduled_posts` — needs at least `business_id`,
        `content` (used as the caption), and `image_url`.

    Returns
    -------
    str
        The published media's Instagram-assigned id.

    Raises
    ------
    InstagramPublishError
        On any failure — missing credentials, missing image_url (the
        Content Publishing API requires a *public* image URL, not a
        local file path — see backend/app/api/v1/endpoints/business.py's
        upload_asset, which already returns a public /uploads/... URL),
        a Graph API error response, or a container that never reaches
        FINISHED within the poll budget.
    """
    business_id = post["business_id"]
    caption = post.get("content", "")
    image_url = post.get("image_url")

    if not image_url:
        # WHY this can't be relaxed to "post text only": Instagram has no
        # concept of a text-only feed post via this API — every /media
        # call needs image_url (or video_url via a separate flow this
        # module doesn't implement yet).
        raise InstagramPublishError(
            "scheduled_posts.image_url is required — Instagram's Content "
            "Publishing API has no text-only post type."
        )

    access_token, ig_user_id = await _get_business_instagram_credentials(business_id)

    async with httpx.AsyncClient(timeout=30.0) as client:
        # ── Step 1: create the media container ──────────────────────────
        create_resp = await client.post(
            f"{GRAPH_API_BASE}/{ig_user_id}/media",
            params={
                "image_url": image_url,
                "caption": caption,
                "access_token": access_token,
            },
        )
        create_data = create_resp.json()
        if create_resp.status_code != 200 or "id" not in create_data:
            raise InstagramPublishError(
                f"Failed to create media container: {create_data.get('error', create_data)}"
            )
        creation_id = create_data["id"]

        # ── Step 2: poll until Meta has finished processing the image ───
        # WHY poll instead of publishing immediately: Meta's own docs warn
        # that publishing a container before it reaches FINISHED can fail
        # with a transient error, especially under load — cheaper to wait
        # a few seconds here than to build separate retry-on-publish logic.
        for _attempt in range(MAX_POLL_ATTEMPTS):
            status_resp = await client.get(
                f"{GRAPH_API_BASE}/{creation_id}",
                params={"fields": "status_code", "access_token": access_token},
            )
            status_data = status_resp.json()
            status_code = status_data.get("status_code")

            if status_code == "FINISHED":
                break
            if status_code == "ERROR":
                raise InstagramPublishError(
                    f"Media container {creation_id} failed processing: {status_data}"
                )
            # IN_PROGRESS or EXPIRED (not yet started) — wait and retry.
            await asyncio.sleep(POLL_INTERVAL_SECONDS)
        else:
            raise InstagramPublishError(
                f"Media container {creation_id} did not finish processing "
                f"within {MAX_POLL_ATTEMPTS * POLL_INTERVAL_SECONDS}s."
            )

        # ── Step 3: publish the container ────────────────────────────────
        publish_resp = await client.post(
            f"{GRAPH_API_BASE}/{ig_user_id}/media_publish",
            params={"creation_id": creation_id, "access_token": access_token},
        )
        publish_data = publish_resp.json()
        if publish_resp.status_code != 200 or "id" not in publish_data:
            raise InstagramPublishError(
                f"Failed to publish media container {creation_id}: "
                f"{publish_data.get('error', publish_data)}"
            )

        logger.info(
            "Published to Instagram | business_id=%s ig_user_id=%s media_id=%s",
            business_id, ig_user_id, publish_data["id"],
        )
        return publish_data["id"]
