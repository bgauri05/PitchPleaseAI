"""
Free image generation via the Hugging Face Serverless Inference API.

─────────────────────────────────────────────────────────────────────────────
WHAT
    A single async function `generate_image_hf` that sends a text prompt to
    the FLUX.1-schnell model hosted on HuggingFace's free Serverless
    Inference API and returns the raw image encoded as a base64 string.

HOW
    1. Reads HF_TOKEN from the centralised Settings singleton (SecretStr —
       never logged or serialised).
    2. Makes an async HTTP POST using httpx.AsyncClient (non-blocking,
       compatible with FastAPI's async runtime).
    3. Implements a retry loop (max 3 attempts, 5 s gap) to handle the
       common 503 "model cold-starting" response that HuggingFace returns
       when a model has not been used recently.
    4. On success (HTTP 200), the binary image bytes are base64-encoded and
       returned as a plain Python str — safe to embed in JSON responses.

WHY FLUX.1-schnell?
    • Currently the fastest open-weight diffusion model.
    • Available for free on HF Serverless Inference (no GPU bill).
    • Generates high-quality 1024×1024 images in a single API call.

SECURITY HIGHLIGHTS
    • HF_TOKEN is stored as SecretStr and accessed ONLY via
      .get_secret_value() at the request callsite — never logged.
    • Caller (the FastAPI endpoint) wraps this function in try/except and
      returns HTTP 500 on failure — raw exceptions never reach the client.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import asyncio
import base64
import logging

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────

import urllib.parse

_HF_API_URL = (
    "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"
)
_MAX_RETRIES = 3
_RETRY_DELAY_SECONDS = 5


# ── Public interface ─────────────────────────────────────────────────────────

async def generate_image_hf(prompt: str) -> str:
    """Generate an image from *prompt* using FLUX.1-schnell model.

    Parameters
    ----------
    prompt : str
        A descriptive text prompt for the image.

    Returns
    -------
    str
        A base64-encoded representation of the generated image.
    """
    settings = get_settings()

    logger.info("Starting image generation | prompt_length=%d", len(prompt))

    # 1. Try Pollinations AI (free, fast FLUX model endpoint)
    try:
        encoded_prompt = urllib.parse.quote(prompt)
        pollinations_url = f"https://image.pollinations.ai/prompt/{encoded_prompt}"
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            response = await client.get(pollinations_url, headers=headers, follow_redirects=True)
            if response.status_code == 200 and len(response.content) > 1000:
                encoded = base64.b64encode(response.content).decode("utf-8")
                logger.info(
                    "Image generation succeeded via Pollinations FLUX | bytes=%d",
                    len(response.content),
                )
                return encoded
    except Exception as exc:
        logger.warning("Pollinations image generation failed | error=%s", exc)

    # 2. Fallback to HF Inference API
    async with httpx.AsyncClient(timeout=60.0) as client:
        headers = {
            "Authorization": f"Bearer {settings.HF_TOKEN.get_secret_value()}",
            "Content-Type": "application/json",
        }
        payload = {"inputs": prompt}

        for attempt in range(1, _MAX_RETRIES + 1):
            response = await client.post(_HF_API_URL, headers=headers, json=payload)
            if response.status_code == 200:
                image_bytes: bytes = response.content
                return base64.b64encode(image_bytes).decode("utf-8")
            if response.status_code == 503 and attempt < _MAX_RETRIES:
                await asyncio.sleep(_RETRY_DELAY_SECONDS)
                continue

    raise Exception("Image generation failed after all attempts.")  # pragma: no cover
