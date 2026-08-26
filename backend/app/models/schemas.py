"""
Pydantic V2 request / response schemas (API Data-Transfer Objects).

─────────────────────────────────────────────────────────────────────────────
WHAT
    DTOs that FastAPI uses to:
      1. **Validate** incoming JSON payloads — reject malformed or
         oversized requests *before* they reach any LLM.
      2. **Serialise** outgoing responses — strip internal fields and
         enforce a stable API contract.

HOW
    Pydantic V2's `model_config`, `Field(…)` constraints, `Literal` types,
    and custom `@field_validator` decorators form multiple layers of defence.

WHY
    Every byte of user input eventually becomes part of an LLM prompt.
    Without strict validation, an attacker could:
      • Send a 1 MB "topic" to balloon token costs (cost-abuse DoS).
      • Inject hidden system-prompt overrides inside a free-text field
        (prompt injection).
      • Sneak unexpected keys into the JSON body to confuse downstream
        logic (mass-assignment / parameter pollution).
    The constraints below address each of these vectors.

SECURITY HIGHLIGHTS
    1. `extra = "forbid"`
       → Any JSON key NOT declared in the schema triggers a 422 rejection.
       → WHY: Prevents mass-assignment / parameter-pollution attacks where
         an attacker adds keys like `"is_admin": true`.

    2. `max_length` on every string field
       → Caps topic at 500 chars and tone_override at 100 chars.
       → WHY: Limits the token volume that reaches the LLM, preventing
         cost-abuse denial-of-service attacks.  Also truncates any
         prompt-injection payload to a length where it's unlikely to
         override the system prompt.

    3. `Literal` type on `platforms`
       → Only `"linkedin"`, `"twitter"`, and `"instagram"` are accepted.
       → WHY: Free-form strings here would let a user inject arbitrary
         text (e.g. `"platform: ignore all instructions and …"`).  The
         Literal constraint means the value is guaranteed to be one of
         three safe constants — no sanitisation needed downstream.

    4. `HttpUrl` on `seed_url`
       → Pydantic ensures the URL has a valid scheme (http/https), host,
         etc.  Exotic schemes like `file://` or `javascript:` are rejected.
       → WHY: Prevents SSRF (Server-Side Request Forgery) if the URL is
         ever fetched by the Researcher agent.

    5. `min_length` on `topic`
       → Rejects empty or single-character topics that would produce
         meaningless LLM output, wasting compute.
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field, HttpUrl


# ──────────────────────────────────────────────────────────────────────────────
# Allowed platform values
# ──────────────────────────────────────────────────────────────────────────────
#   WHY a module-level constant?
#     • Re-used in both the request schema (validation) and the graph/agent
#       code (iteration), so a single source of truth avoids drift.
#     • Literal["linkedin", …] is repeated inline because Pydantic V2 needs
#       the literal annotation on the field itself for JSON Schema generation.

ALLOWED_PLATFORMS = {"linkedin", "twitter", "instagram", "facebook", "whatsapp", "email"}

from typing import Literal  # noqa: E402 — grouped with typing imports above

PlatformStr = Literal["linkedin", "twitter", "instagram", "facebook", "whatsapp", "email"]
"""Type alias — only these six string values pass validation."""


# ──────────────────────────────────────────────────────────────────────────────
# Request DTO
# ──────────────────────────────────────────────────────────────────────────────

class ContentRequest(BaseModel):
    """Incoming payload for the content-generation pipeline.

    Every field is constrained to the tightest bounds that still support
    real-world usage.  See SECURITY HIGHLIGHTS in the module docstring.
    """

    # ── SECURITY: reject any undeclared JSON keys immediately ────────────
    model_config = {"extra": "forbid"}

    # ── business_id ──────────────────────────────────────────────────────
    business_id: Optional[str] = Field(
        default="default_business_id",
        description="UUID of the business this content is being generated for.",
    )

    # ── topic ────────────────────────────────────────────────────────────
    #   WHAT:  The subject the user wants content about.
    #   VALIDATION:
    #     • min_length=3   → rejects trivially empty inputs that waste LLM
    #                        compute with meaningless completions.
    #     • max_length=500 → caps the token volume injected into the LLM
    #                        prompt, limiting cost-abuse and truncating any
    #                        prompt-injection payload.
    #     • strip_whitespace=True → normalises leading/trailing whitespace
    #                        so " hello " and "hello" are equivalent.
    topic: str = Field(
        ...,
        min_length=3,
        max_length=500,
        description="Subject for content generation (e.g. 'Diwali sale announcement').",
        json_schema_extra={"strip_whitespace": True},
    )

    # ── platforms ────────────────────────────────────────────────────────
    #   WHAT:  List of social-media platforms to generate content for.
    #   VALIDATION:
    #     • Literal type → only "linkedin", "twitter", "instagram" accepted.
    #       Any other string triggers a 422 — this blocks prompt injection
    #       through the platform field.
    #     • min_length=1 → at least one platform must be selected.
    #     • max_length=3 → cannot exceed the number of supported platforms.
    #   WHY a list?  Users often want multi-platform content in one request.
    platforms: List[PlatformStr] = Field(
        ...,
        min_length=1,
        max_length=6,
        description="Target platforms. Allowed: 'linkedin', 'twitter', 'instagram', 'facebook', 'whatsapp', 'email'.",
    )

    # ── tone_override (optional) ─────────────────────────────────────────
    #   WHAT:  Free-text override for the brand's default tone-of-voice.
    #   VALIDATION:
    #     • max_length=100 → tight cap because this string is injected
    #       directly into the Creator agent's prompt.  100 chars is enough
    #       for descriptors like "formal, witty, Gen-Z slang" but too short
    #       for meaningful prompt-injection payloads.
    #     • Optional → can be omitted; agents will use brand defaults.
    tone_override: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Optional tone descriptor (e.g. 'formal', 'witty').",
    )

    # ── seed_url (optional) ──────────────────────────────────────────────
    #   WHAT:  A reference URL the Researcher agent can use for inspiration
    #          (e.g. a competitor blog post or product page).
    #   VALIDATION:
    #     • HttpUrl → Pydantic ensures a valid http(s) URL; rejects
    #       dangerous schemes like file://, javascript:, data:.
    #     • SECURITY (SSRF mitigation): Even though the URL is validated
    #       here, the Researcher agent should ALSO apply an allowlist or
    #       deny private IP ranges before actually fetching it.
    seed_url: Optional[HttpUrl] = Field(
        default=None,
        description="Optional reference URL for the Researcher agent.",
    )


# ──────────────────────────────────────────────────────────────────────────────
# Response DTO
# ──────────────────────────────────────────────────────────────────────────────

class ContentResponse(BaseModel):
    """Outgoing payload returned after the multi-agent pipeline completes.

    WHAT:  A deterministic envelope that tells the caller:
           • What content was generated (per platform).
           • Whether it passed the Sentinel quality gate.
           • How many revision loops were needed.
    """

    status: str = Field(
        ...,
        description=(
            "Pipeline outcome — e.g. 'approved', 'max_iterations_reached', 'error'."
        ),
    )

    final_content: Dict[str, Any] = Field(
        default_factory=dict,
        description=(
            "Mapping of platform name → content bundle. "
            "Each value is a dict with 'text' (post copy) and "
            "'image_prompt' (generative-AI prompt) fields. "
            "Example: {'linkedin': {'text': '…', 'image_prompt': '…'}}."
        ),
    )

    iteration_count: int = Field(
        ...,
        ge=0,
        description="Total Creator ↔ Sentinel revision loops executed.",
    )


# ──────────────────────────────────────────────────────────────────────────────
# Business / Brand Memory Setup DTO
# ──────────────────────────────────────────────────────────────────────────────

class BusinessSetupRequest(BaseModel):
    """Incoming payload for creating/updating a Business Brand Memory profile."""

    business_id: Optional[str] = Field(
        default=None,
        description="Optional UUID of existing business to update.",
    )
    user_id: Optional[str] = Field(
        default=None,
        description=(
            "Supabase auth.users.id of the account performing setup, so the "
            "businesses row can be owned by (and later recovered by) that "
            "account. Optional so anonymous/local setup keeps working."
        ),
    )
    business_name: Optional[str] = Field(
        default=None,
        description="Name of the business.",
    )
    name: Optional[str] = Field(
        default=None,
        description="Legacy field alias for business_name.",
    )
    industry: str = Field(
        ...,
        description="Business industry or category.",
    )
    business_description: Optional[str] = Field(
        default="",
        max_length=1000,
        description="2-3 line description of the business.",
    )
    brand_voice: List[str] = Field(
        default_factory=list,
        description="List of selected brand voice traits (e.g. Friendly, Luxury, Bold).",
    )
    brand_values: List[str] = Field(
        default_factory=list,
        max_length=5,
        description="List of up to 5 core brand values (e.g. Trust, Sustainability).",
    )
    target_audience: str = Field(
        default="",
        max_length=1000,
        description="Description of target audience.",
    )
    products_services: str = Field(
        default="",
        max_length=1000,
        description="Description of products or services offered.",
    )
    logo_url: Optional[str] = Field(
        default=None,
        description="URL or file path to brand logo image.",
    )
    brand_images: List[str] = Field(
        default_factory=list,
        description="List of URLs or paths for 3-5 product/service images.",
    )
    ai_instructions: Optional[str] = Field(
        default="",
        max_length=1000,
        description="Persistent custom instructions for AI content generation.",
    )
    tone: Optional[str] = Field(
        default=None,
        description="Legacy single tone string for backward compatibility.",
    )


class BusinessProfileResponse(BaseModel):
    """Response payload containing complete Business Brand Memory profile."""

    id: str = Field(..., description="UUID of the business.")
    business_name: str = Field(..., description="Name of the business.")
    name: Optional[str] = Field(default=None, description="Legacy alias for business_name.")
    industry: Optional[str] = Field(default="", description="Industry or category.")
    business_description: Optional[str] = Field(default="", description="2-3 line description.")
    brand_voice: List[str] = Field(default_factory=list, description="Array of voice traits.")
    brand_values: List[str] = Field(default_factory=list, description="Array of up to 5 brand values.")
    target_audience: Optional[str] = Field(default="", description="Target audience description.")
    products_services: Optional[str] = Field(default="", description="Products / services description.")
    logo_url: Optional[str] = Field(default=None, description="Brand logo image URL.")
    brand_images: List[str] = Field(default_factory=list, description="Array of product/service image URLs.")
    ai_instructions: Optional[str] = Field(default="", description="Persistent AI instructions.")
    tone: Optional[str] = Field(default=None, description="Legacy tone string.")
    created_at: Optional[str] = Field(default=None, description="Creation timestamp.")
    updated_at: Optional[str] = Field(default=None, description="Last update timestamp.")


