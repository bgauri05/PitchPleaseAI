"""
Background scheduler for scheduled_posts.

WHAT: Periodically checks for posts whose scheduled_time has passed and
      are still 'pending', and attempts to publish them.
HOW:  APScheduler runs check_due_posts() on a fixed interval, inside the
      same process as the FastAPI app.
WHY:  scheduled_posts rows are just data until something actively watches
      the table and acts on due entries — this is that "something."

STATUS: The actual publish step is a stub (publish_stub) until step 5
        (real Instagram OAuth + publishing) exists. Right now this proves
        the *detection and firing* mechanism works, using fake near-future
        timestamps for testing.
"""
import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.services.supabase import get_supabase_client

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()


async def publish_stub(post: dict) -> bool:
    """Placeholder for the real Instagram publish call (step 5).
    Always 'succeeds' for now so we can test the detection loop end to end."""
    logger.info(
        "STUB PUBLISH | business_id=%s platform=%s content=%.50s...",
        post["business_id"], post["platform"], post["content"],
    )
    return True


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
            success = await publish_stub(post)
            new_status = "posted" if success else "failed"
            client.table("scheduled_posts").update({
                "status": new_status,
            }).eq("id", post["id"]).execute()
            logger.info("Post %s marked %s", post["id"], new_status)
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
