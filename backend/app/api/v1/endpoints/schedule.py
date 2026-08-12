from __future__ import annotations

import uuid

from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.services.supabase import get_supabase_client

router = APIRouter()


class ScheduleRequest(BaseModel):
    business_id: str
    content: str
    image_url: str | None = None
    platform: str
    scheduled_time: str  # ISO 8601 string, e.g. "2026-08-15T14:30:00Z"


@router.post("")
def create_scheduled_post(request: ScheduleRequest):
    client = get_supabase_client()
    result = client.table("scheduled_posts").insert({
        "id": str(uuid.uuid4()),
        "business_id": request.business_id,
        "content": request.content,
        "image_url": request.image_url,
        "platform": request.platform,
        "scheduled_time": request.scheduled_time,
        "status": "pending",
    }).execute()
    return {"scheduled_post": result.data[0]}


@router.get("")
def list_scheduled_posts(business_id: str = Query(...)):
    client = get_supabase_client()
    result = (
        client.table("scheduled_posts")
        .select("*")
        .eq("business_id", business_id)
        .order("scheduled_time")
        .execute()
    )
    return {"scheduled_posts": result.data}
