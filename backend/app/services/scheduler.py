"""
Background scheduler for scheduled_posts.

WHAT: Periodically checks for posts whose scheduled_time has passed and
      are still 'pending', and attempts to publish them.
HOW:  APScheduler runs check_due_posts() on a fixed interval, inside the
      same process as the FastAPI app.
WHY:  scheduled_posts rows are just data until something actively watches
      the table and acts on due entries — this is that "something."

STATUS: The publish step now calls the real Instagram Graph API via
        app.services.instagram_publish.publish_to_instagram() instead of
        the old stub. It still can't succeed end to end until a real Meta
        App ID/Secret exist (see instagram.py) and at least one business
        has completed the OAuth connect flow — but the detection, firing,
        error handling, and status-update mechanism here are real, not a
        simulation. Only 'instagram' is wired up; other platforms fail
        loudly with a clear "not yet supported" error rather than
        silently reporting success.
"""
import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.supabase import get_supabase_client
from app.services.instagram_publish import publish_to_instagram, InstagramPublishError

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


async def publish_post(post: dict) -> str:
    """Publish *post* to whichever platform it's targeted at.

    Returns the platform-assigned post/media id on success. Raises on
    failure — callers are expected to catch and record the error rather
    than this function swallowing it, so a failure is never silently
    reported as a success (the old publish_stub's behavior).
    """
    platform = (post.get("platform") or "").lower()

    if platform == "instagram":
        return await publish_to_instagram(post)

    # WHY raise instead of returning False: other platforms (Facebook,
    # LinkedIn, Twitter/X) aren't implemented yet. Silently marking these
    # "posted" would be worse than doing nothing — it would tell the user
    # something went live when it didn't.
    raise InstagramPublishError(
        f"Publishing to platform={platform!r} is not implemented yet — "
        "only 'instagram' is currently wired to a real API call."
    )


async def check_due_posts():
    """Find pending posts whose time has come, and process each one."""
    client = get_supabase_client()
    now = datetime.now(timezone.utc).isoformat()

    result = (
        client.table("scheduled_posts")
        .select("*")
        .eq("status", "pending")
        .lte("scheduled_time", now)
        .execute()
    )
    due_posts = result.data

    if not due_posts:
        logger.info("Scheduler tick: no due posts.")
        return

    logger.info("Scheduler tick: %d due post(s) found.", len(due_posts))

    for post in due_posts:
        try:
            platform_post_id = await publish_post(post)
            client.table("scheduled_posts").update({
                "status": "posted",
                "platform_post_id": platform_post_id,
                "error_message": None,
            }).eq("id", post["id"]).execute()
            logger.info("Post %s marked posted (platform_post_id=%s)", post["id"], platform_post_id)
        except Exception as exc:
            logger.error("Post %s failed: %s", post["id"], exc, exc_info=True)
            client.table("scheduled_posts").update({
                "status": "failed",
                "error_message": str(exc),
            }).eq("id", post["id"]).execute()


def start_scheduler():
    scheduler.add_job(check_due_posts, "interval", seconds=60, id="check_due_posts")
    scheduler.start()
    logger.info("Scheduler started — checking scheduled_posts every 60s.")


def stop_scheduler():
    scheduler.shutdown()
    logger.info("Scheduler stopped.")
