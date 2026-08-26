"""
Integration tests for the /api/v1/content/generate endpoint.

─────────────────────────────────────────────────────────────────────────────
WHAT
    Three tests that verify the full request → FastAPI → LangGraph → response
    chain behaves correctly:

      1. test_auth_missing_api_key   — security gate rejects missing key (403)
      2. test_validation_invalid_payload — Pydantic rejects bad input (422)
      3. test_live_graph_generation  — end-to-end run with real LLM calls

HOW
    • `TestClient` from `fastapi.testclient` wraps the ASGI app and exposes a
      synchronous requests-compatible interface, so tests read like normal
      HTTP calls with no async boilerplate.
    • The app instance is imported directly from `app.main` — the same object
      that `uvicorn` / `Mangum` serve in production.
    • `get_settings()` provides the API key so the test never hard-codes a
      secret and stays in sync with whatever is in .env.

WHY real LLM calls in test_live_graph_generation?
    Mocking the LLM would only verify that the routing wiring works, NOT that:
      • The Groq API key is valid and the model responds correctly.
      • The system prompts produce the expected JSON schema.
      • The LangGraph state-merge logic passes the right data between nodes.
    A real end-to-end call catches all of these — it's an integration test,
    not a unit test.

    Trade-off: the test is slower (~5–15 s) and requires a live network.
    Run it as part of a pre-deploy check rather than a fast unit suite.
    To skip during offline development:
        pytest -k "not live" tests/
─────────────────────────────────────────────────────────────────────────────
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.core.config import get_settings

# ─────────────────────────────────────────────────────────────────────────────
# Shared test fixtures
# ─────────────────────────────────────────────────────────────────────────────

# WHAT:  A single TestClient instance reused across all tests.
# HOW:   TestClient wraps the ASGI app in a requests-style interface.
#        It starts / stops the app's lifespan context automatically.
# WHY module-level (not per-test fixture)?
#        Creating TestClient once avoids repeated startup/shutdown overhead
#        and mirrors real-world behaviour where the process stays alive across
#        many requests.
client = TestClient(app)

# WHAT:  Pull the API key from the same Settings singleton the app uses.
# HOW:   `.get_secret_value()` extracts the raw string from the SecretStr
#        wrapper — the only place this is safe to do (inside tests / auth code).
# WHY not hard-code "hackathon_super_secret_key"?
#        If the key rotates in .env, the test automatically picks up the new
#        value without any code change.
VALID_API_KEY: str = get_settings().API_KEY.get_secret_value()

# Convenience header dicts used across test functions.
VALID_HEADERS    = {"X-API-Key": VALID_API_KEY}
NO_AUTH_HEADERS: dict = {}  # deliberately empty — used in auth test

# A payload that is valid against all ContentRequest constraints.
VALID_PAYLOAD = {
    "business_id": "test_bus_123",
    "topic": "Launch of a new AI developer tool",
    "platforms": ["twitter", "linkedin"],
    "tone_override": "professional and engaging",
}

# The full endpoint path (mirrors the router prefix wiring in main.py +
# router.py + content.py).
ENDPOINT = "/api/v1/content/generate"


# ─────────────────────────────────────────────────────────────────────────────
# Test 1 — Authentication guard
# ─────────────────────────────────────────────────────────────────────────────

def test_auth_missing_api_key() -> None:
    """Verify that omitting the X-API-Key header yields a 403 Forbidden.

    WHAT is being tested?
        The `verify_api_key` FastAPI dependency is wired into the route via
        `Depends(verify_api_key)`.  When no header is present, the dependency
        must short-circuit and return 403 *before* any LLM call is made.

    WHY 403 and not 401?
        HTTP 401 (Unauthorized) implies a challenge/response authentication
        scheme (e.g. Bearer token with WWW-Authenticate header).  403
        (Forbidden) is semantically correct for a static API-key gate: the
        server understands the request but refuses to authorise it.

    Expected result: HTTP 403
    """
    response = client.post(
        ENDPOINT,
        json=VALID_PAYLOAD,
        headers=NO_AUTH_HEADERS,   # no X-API-Key header at all
    )

    # Guard must fire — no content should have been generated.
    assert response.status_code == 403, (
        f"Expected 403 for missing API key, got {response.status_code}. "
        f"Body: {response.text}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# Test 2 — Input validation
# ─────────────────────────────────────────────────────────────────────────────

def test_validation_invalid_payload() -> None:
    """Verify that an unsupported platform name is rejected with 422.

    WHAT is being tested?
        `ContentRequest.platforms` is typed as `List[Literal["linkedin",
        "twitter", "instagram"]]`.  Pydantic V2's `extra="forbid"` and the
        Literal constraint mean "tiktok" must be rejected before the route
        body even starts executing.

    HOW does this work?
        FastAPI calls Pydantic validation on the request body automatically.
        A validation failure returns HTTP 422 Unprocessable Entity with a
        structured error body describing every failing field.

    WHY is this important?
        The platform value is injected directly into LLM prompts.  Allowing
        arbitrary strings here would be a prompt-injection vector.  The
        Literal constraint is our first line of defence.

    Expected result: HTTP 422
    """
    invalid_payload = {
        "topic": "Testing platform validation",
        "platforms": ["tiktok"],          # "tiktok" is not in the Literal list
    }

    response = client.post(
        ENDPOINT,
        json=invalid_payload,
        headers=VALID_HEADERS,
    )

    # Pydantic validation must reject the payload — no LLM tokens consumed.
    assert response.status_code == 422, (
        f"Expected 422 for invalid platform 'tiktok', got {response.status_code}. "
        f"Body: {response.text}"
    )

    # Optionally verify the error body pinpoints the right field.
    body = response.json()
    assert "detail" in body, "422 response must include a 'detail' field."
    # The detail list should mention 'platforms' somewhere.
    detail_str = str(body["detail"])
    assert "platforms" in detail_str.lower() or "literal" in detail_str.lower(), (
        f"422 detail should reference the invalid 'platforms' field. Got: {detail_str}"
    )


# ─────────────────────────────────────────────────────────────────────────────
# Test 3 — Live end-to-end pipeline
# ─────────────────────────────────────────────────────────────────────────────

@pytest.mark.slow   # mark so this test can be skipped with: pytest -m "not slow"
def test_live_graph_generation() -> None:
    """Run the full LangGraph pipeline with real LLM calls and assert the output.

    WHAT is being tested?
        The entire stack, in order:
          1. FastAPI authentication (X-API-Key header validated)
          2. Pydantic input validation (ContentRequest)
          3. LangGraph workflow:
               Researcher node  → writes research_context
               Creator node     → writes current_drafts + loop_count
               Sentinel node    → writes is_approved + sentinel_feedback
               Conditional edge → routes to END or back to Creator
          4. ContentResponse serialisation (Pydantic output model)
          5. JSON response structure (status, final_content, iteration_count)

    WHY no mocks?
        Mocking `get_llm()` or patching the LangChain chain would verify only
        the wiring, not the real behaviour.  This test catches:
          • An expired / revoked GROQ_API_KEY.
          • A changed model name that the Groq endpoint no longer accepts.
          • A system prompt that produces malformed JSON the parser rejects.
          • A LangGraph state-merge regression where a key isn't passed
            correctly between nodes.

    NOTE: This test makes real outbound HTTPS calls to Groq (and possibly
    AWS Bedrock as fallback).  It requires:
      • A valid GROQ_API_KEY in backend/.env
      • Network access to api.groq.com
      • ~5–15 seconds to complete

    Expected result:
      • HTTP 200
      • status ∈ {"success", "partial_success"}
      • iteration_count ≥ 1  (at least one Creator draft was made)
      • final_content keys ⊇ {"twitter", "linkedin"}
      • Each platform value has "text" (str) and "image_prompt" (str)
    """
    response = client.post(
        ENDPOINT,
        json=VALID_PAYLOAD,
        headers=VALID_HEADERS,
        timeout=120,   # generous timeout — real LLM calls are slow
    )

    # ── Assert HTTP 200 ───────────────────────────────────────────────────
    assert response.status_code == 200, (
        f"Expected 200 from live pipeline, got {response.status_code}. "
        f"Body: {response.text}"
    )

    body = response.json()

    # ── Assert top-level response shape ───────────────────────────────────
    # WHAT:  Check the three fields defined in ContentResponse.
    assert "status" in body, "Response must include a 'status' field."
    assert "iteration_count" in body, "Response must include 'iteration_count'."
    assert "final_content" in body, "Response must include 'final_content'."

    # ── Assert status value ───────────────────────────────────────────────
    # WHAT:  "success" = Sentinel approved; "partial_success" = circuit
    #        breaker fired after 3 loops without approval.
    # WHY allow both?  Either is a valid pipeline outcome — we are testing
    #        that the pipeline COMPLETES, not that the Sentinel always approves.
    assert body["status"] in {"success", "partial_success"}, (
        f"status must be 'success' or 'partial_success', got: {body['status']!r}"
    )

    # ── Assert iteration_count ────────────────────────────────────────────
    # WHAT:  Must be an integer ≥ 1, proving the Creator node ran at least once.
    iteration_count = body["iteration_count"]
    assert isinstance(iteration_count, int), (
        f"iteration_count must be an int, got {type(iteration_count).__name__}"
    )
    assert iteration_count >= 1, (
        f"iteration_count must be ≥ 1, got {iteration_count}"
    )

    # ── Assert final_content structure ────────────────────────────────────
    final_content = body["final_content"]
    assert isinstance(final_content, dict), (
        f"final_content must be a dict, got {type(final_content).__name__}"
    )

    # Every requested platform must appear as a key.
    requested_platforms = set(VALID_PAYLOAD["platforms"])
    missing = requested_platforms - set(final_content.keys())
    assert not missing, (
        f"final_content is missing platform(s): {missing}. "
        f"Got keys: {list(final_content.keys())}"
    )

    # ── Assert per-platform bundle structure ──────────────────────────────
    # WHAT:  Each platform value must be a dict with "text" and "image_prompt".
    # HOW:   The Creator's PlatformDraft schema enforces both fields exist;
    #        this assertion confirms the structure survived serialisation and
    #        the ContentResponse passthrough.
    for platform in requested_platforms:
        bundle = final_content[platform]

        assert isinstance(bundle, dict), (
            f"final_content['{platform}'] must be a dict, "
            f"got {type(bundle).__name__}"
        )

        # "text" — the ready-to-post social media copy
        assert "text" in bundle, (
            f"final_content['{platform}'] missing 'text' key. "
            f"Got keys: {list(bundle.keys())}"
        )
        assert isinstance(bundle["text"], str) and bundle["text"].strip(), (
            f"final_content['{platform}']['text'] must be a non-empty string."
        )

        # "image_prompt" — the generative-AI image description
        assert "image_prompt" in bundle, (
            f"final_content['{platform}'] missing 'image_prompt' key. "
            f"Got keys: {list(bundle.keys())}"
        )
        assert isinstance(bundle["image_prompt"], str) and bundle["image_prompt"].strip(), (
            f"final_content['{platform}']['image_prompt'] must be a non-empty string."
        )
