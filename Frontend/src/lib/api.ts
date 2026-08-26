/**
 * BrandSetu API Client
 * --------------------
 * Typed, fetch-based client for the FastAPI backend.
 *
 * Configuration is read from Vite env variables:
 *   VITE_API_URL  — e.g. "http://localhost:8000/api/v1"
 *   VITE_API_KEY  — the X-API-Key secret shared with the backend
 *
 * Both variables must be set in `.env.local` (never committed to git).
 */

// ── Env configuration ────────────────────────────────────────────────────────

const API_URL = import.meta.env.VITE_API_URL as string;
const API_KEY = import.meta.env.VITE_API_KEY as string;

// ── TypeScript Interfaces ────────────────────────────────────────────────────

/** The platform keys the backend pipeline accepts (lowercase, validated as Literals). */
export type BackendPlatform = 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'whatsapp' | 'email';

/** Request body sent to POST /content/generate */
export interface ContentRequest {
    /** Unique business identifier for brand memory context. */
    business_id: string;
    /** The marketing topic or brief (max 500 chars on the backend). */
    topic: string;
    /** Platforms to generate copy for — must use the backend's lowercase keys. */
    platforms: BackendPlatform[];
    /** Optional tone override — overrides the brand's default voice setting. */
    tone_override?: string;
}

/** Per-platform draft returned by the agent pipeline. */
export interface PlatformDraft {
    /** The finished copy for the platform. */
    text: string;
    /** A Stable-Diffusion-style prompt for a matching image. */
    image_prompt: string;
}

/** Response body from POST /content/generate */
export interface ContentResponse {
    /** "success" | "partial_success" | "error" */
    status: string;
    /** Number of Creator → Sentinel revision loops that ran. */
    iteration_count: number;
    /** Keyed by platform name (matches the values in ContentRequest.platforms). */
    final_content: Record<string, PlatformDraft>;
}

/** Response body from POST /content/generate-image */
export interface ImageGenerationResponse {
    /**
     * Raw image bytes encoded as base64.
     * Use as: `<img src={\`data:image/png;base64,${image_base64}\`} />`
     */
    image_base64: string;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

/** Standard headers included in every request. */
const defaultHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    "X-API-Key": API_KEY,
};

/**
 * Shared error handler.
 * Attempts to parse a FastAPI-style `{ "detail": "..." }` error body.
 * Falls back to a generic message if the response is not JSON.
 */
async function handleErrorResponse(response: Response): Promise<never> {
    let detail: string;

    try {
        const body = await response.json();
        detail =
            typeof body?.detail === "string"
                ? body.detail
                : JSON.stringify(body?.detail ?? body);
    } catch {
        detail = response.statusText || "Unknown error";
    }

    throw new Error(`HTTP ${response.status}: ${detail}`);
}

// ── API Client ───────────────────────────────────────────────────────────────

export const apiClient = {
    /**
     * Run the multi-agent content generation pipeline.
     *
     * @param request - Topic, target platforms, and optional tone override.
     * @returns Structured per-platform drafts with image prompts.
     * @throws {Error} On non-2xx responses or network failures.
     *
     * @example
     * const result = await apiClient.generateContent({
     *   topic: "Diwali sale — 30% off everything",
     *   platforms: ["Instagram", "LinkedIn"],
     *   tone_override: "festive and warm",
     * });
     * console.log(result.final_content["Instagram"].text);
     */
    async generateContent(request: ContentRequest): Promise<ContentResponse> {
        const response = await fetch(`${API_URL}/content/generate`, {
            method: "POST",
            headers: defaultHeaders,
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            await handleErrorResponse(response);
        }

        return response.json() as Promise<ContentResponse>;
    },

    /**
     * Generate an image from a text prompt via FLUX.1-schnell on HuggingFace.
     *
     * @param prompt - Descriptive image prompt, e.g. "Diwali lights, bokeh, warm".
     * @returns Base64-encoded PNG/JPEG image string.
     * @throws {Error} On non-2xx responses or network failures.
     *
     * @example
     * const { image_base64 } = await apiClient.generateImage("Holi festival colors");
     * // <img src={`data:image/png;base64,${image_base64}`} />
     */
    async generateImage(prompt: string): Promise<ImageGenerationResponse> {
        const response = await fetch(`${API_URL}/content/generate-image`, {
            method: "POST",
            headers: defaultHeaders,
            body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
            await handleErrorResponse(response);
        }

        return response.json() as Promise<ImageGenerationResponse>;
    },

    /**
     * Save or update business Brand Memory profile.
     */
    async setupBusiness(payload: Record<string, any>): Promise<any> {
        const response = await fetch(`${API_URL}/business/setup`, {
            method: "POST",
            headers: defaultHeaders,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            await handleErrorResponse(response);
        }

        return response.json();
    },
};
