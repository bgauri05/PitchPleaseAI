from __future__ import annotations

import base64
import os
import uuid
import logging
from typing import List, Optional, Dict
from fastapi import APIRouter, File, UploadFile, HTTPException, Body
from pydantic import BaseModel
from app.models.schemas import BusinessSetupRequest, BusinessProfileResponse
from app.services.supabase import get_supabase_client
from app.services.brand_memory import (
    add_brand_guideline,
    get_business_profile,
    upsert_business_profile,
    update_business_profile,
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Directory for storing uploaded brand assets locally
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload-asset")
async def upload_asset(file: UploadFile = File(...)):
    """Validate and upload a brand image asset (logo or product image)."""
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files (JPEG, PNG, WebP, SVG) are allowed.")

    # Read and enforce max 10MB limit
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum limit of 10MB.")

    ext = os.path.splitext(file.filename or "")[1] or ".png"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(content)

    public_url = f"/uploads/{filename}"
    return {"filename": filename, "url": public_url}


class SaveGeneratedImageRequest(BaseModel):
    image_base64: str
    extension: str = ".png"


@router.post("/save-generated-image")
async def save_generated_image(request: SaveGeneratedImageRequest):
    """Persist a base64 AI-generated image to disk and return its public URL.

    WHAT: apiClient.generateImage() (Frontend/src/lib/api.ts) returns raw
          base64 image data that's only ever shown in-browser — it's never
          saved anywhere with a real URL. Instagram's Content Publishing
          API requires a public image_url for every post (there is no
          text-only post type). This endpoint closes that gap by reusing
          the same disk-save pattern as upload_asset() above, just
          accepting base64 bytes instead of a multipart file upload.
    NOTE: The returned "/uploads/..." URL is only actually fetchable by
          Meta's servers once this backend is deployed with a public
          domain — on localhost it will save and serve fine for local
          testing (viewable in a browser pointed at the backend), but a
          real Instagram publish call against it will still fail with a
          network error until deployment. See instagram_publish.py.
    """
    try:
        image_bytes = base64.b64decode(request.image_base64)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid base64 image data.")

    filename = f"{uuid.uuid4()}{request.extension}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(image_bytes)

    return {"filename": filename, "url": f"/uploads/{filename}"}


@router.post("/setup")
async def setup_business(request: BusinessSetupRequest):
    """Create or update a Business Brand Memory profile."""
    business_id = request.business_id or str(uuid.uuid4())

    name = request.business_name or request.name or "My Business"
    voice_str = ", ".join(request.brand_voice) if request.brand_voice else (request.tone or "Professional")
    values_str = ", ".join(request.brand_values) if request.brand_values else "Quality"

    # Prepare payload for Supabase database table
    payload = {
        "id": business_id,
        "name": name,
        "business_name": name,
        "industry": request.industry,
        "business_description": request.business_description or "",
        "brand_voice": request.brand_voice,
        "brand_values": request.brand_values,
        "target_audience": request.target_audience or "",
        "products_services": request.products_services or "",
        "logo_url": request.logo_url or "",
        "brand_images": request.brand_images,
        "ai_instructions": request.ai_instructions or "",
        "tone": voice_str,
    }

    # WHAT: ties this business to the authenticated account that set it up.
    # WHY: previously never written, so `businesses.user_id` was always null
    # even though the column + FK exist (migration 003) — the app only
    # linked account -> business via `profiles.business_id`. This closes
    # that gap. Only set when present so a call without it (e.g. a stale
    # session) doesn't null out an owner set by a prior call.
    if request.user_id:
        payload["user_id"] = request.user_id

    result = await upsert_business_profile(payload)

    # Compile comprehensive Brand Memory text for vector storage (RAG)
    guideline_parts = [
        f"Business Name: {name}",
        f"Industry: {request.industry}",
    ]
    if request.business_description:
        guideline_parts.append(f"Business Description: {request.business_description}")
    if request.brand_voice:
        guideline_parts.append(f"Brand Voice: {voice_str}")
    if request.brand_values:
        guideline_parts.append(f"Brand Values: {values_str}")
    if request.target_audience:
        guideline_parts.append(f"Target Audience: {request.target_audience}")
    if request.products_services:
        guideline_parts.append(f"Products & Services: {request.products_services}")
    if request.ai_instructions:
        guideline_parts.append(f"Persistent AI Rules / Instructions: {request.ai_instructions}")

    guideline_text = "\n".join(guideline_parts)

    stored = await add_brand_guideline(
        business_id=business_id,
        content=guideline_text,
        metadata={"source": "onboarding_v2"},
    )

    return {
        "business_id": business_id,
        "brand_memory_stored": stored,
        "profile": result or payload,
    }


@router.put("/{business_id}")
async def update_business(business_id: str, updates: Dict = Body(...)):
    """Update specific fields of an existing Business Brand Memory profile."""
    updated = await update_business_profile(business_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Business profile not found or update failed")
    
    return {
        "business_id": business_id,
        "status": "updated",
        "profile": updated,
    }


@router.get("/{business_id}")
async def get_business(business_id: str):
    """Retrieve existing Business Brand Memory profile.

    SECURITY: `businesses.instagram_access_token` (added by
    backend/migrations/004_instagram_connect.sql, written by the OAuth
    callback in instagram.py) is a long-lived Instagram access token — it
    must never reach the browser. get_business_profile() does a bare
    `select("*")`, so we redact it here rather than in every caller.
    `instagram_user_id` is not a secret (just an account id) and is kept
    so the frontend can show connection status without needing the token.
    """
    profile = await get_business_profile(business_id)
    if profile:
        profile.pop("instagram_access_token", None)
        profile["instagram_connected"] = bool(profile.get("instagram_user_id"))
        return profile

    raise HTTPException(status_code=404, detail="Business not found")