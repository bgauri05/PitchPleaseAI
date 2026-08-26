/**
 * Scheduling + Instagram Connect API client
 * ------------------------------------------
 * Talks to backend/app/api/v1/endpoints/instagram.py and schedule.py.
 * Same env configuration as src/lib/api.ts (VITE_API_URL, VITE_API_KEY).
 *
 * WHAT: This is the frontend half of "connect Instagram + schedule a
 *       post" — the backend endpoints already existed, but nothing in
 *       the UI called them yet.
 */

const API_URL = import.meta.env.VITE_API_URL as string;
const API_KEY = import.meta.env.VITE_API_KEY as string;

const defaultHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY,
};

export interface ScheduledPost {
  id: string;
  business_id: string;
  content: string;
  image_url: string | null;
  platform: string;
  scheduled_time: string;
  status: 'pending' | 'posted' | 'failed';
  error_message: string | null;
  platform_post_id?: string | null;
  created_at: string;
}

async function handleErrorResponse(response: Response): Promise<never> {
  let detail: string;
  try {
    const body = await response.json();
    detail = typeof body?.detail === 'string' ? body.detail : JSON.stringify(body?.detail ?? body);
  } catch {
    detail = response.statusText || 'Unknown error';
  }
  throw new Error(`HTTP ${response.status}: ${detail}`);
}

/**
 * Builds the URL that kicks off the Instagram OAuth connect flow
 * (backend/app/api/v1/endpoints/instagram.py `/connect`). Navigating the
 * browser to this URL redirects to Facebook's consent screen; Facebook
 * then redirects back to the backend's `/callback`, which stores the
 * access token on the business row.
 */
export function getInstagramConnectUrl(businessId: string): string {
  return `${API_URL}/instagram/connect?business_id=${encodeURIComponent(businessId)}`;
}

/**
 * Persists a base64 AI-generated image (apiClient.generateImage's output)
 * to the backend and returns an absolute URL to it.
 *
 * WHAT: Instagram's Content Publishing API needs a public image_url for
 * every post — a base64 blob shown only in the browser can't be used
 * directly. This calls the backend's /business/save-generated-image
 * endpoint (which writes the file and returns a relative "/uploads/..."
 * path) and resolves that against API_URL's origin so callers get
 * something fetchable, e.g. "http://localhost:8000/uploads/abc123.png".
 *
 * NOTE: that URL is only reachable from *this machine* while running
 * locally — Meta's servers can't fetch localhost. It becomes genuinely
 * public once the backend is deployed. See instagram_publish.py.
 */
export async function saveGeneratedImage(imageBase64: string): Promise<string> {
  const response = await fetch(`${API_URL}/business/save-generated-image`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify({ image_base64: imageBase64 }),
  });
  if (!response.ok) await handleErrorResponse(response);
  const data = await response.json();
  // API_URL is like "http://localhost:8000/api/v1" — strip the "/api/v1"
  // suffix to get the backend's origin, since /uploads is mounted at the
  // app root, not under /api/v1 (see backend/app/main.py).
  const backendOrigin = API_URL.replace(/\/api\/v1\/?$/, '');
  return `${backendOrigin}${data.url}`;
}

export async function createScheduledPost(input: {
  business_id: string;
  content: string;
  image_url?: string | null;
  platform: string;
  scheduled_time: string; // ISO 8601
}): Promise<ScheduledPost> {
  const response = await fetch(`${API_URL}/schedule`, {
    method: 'POST',
    headers: defaultHeaders,
    body: JSON.stringify(input),
  });
  if (!response.ok) await handleErrorResponse(response);
  const data = await response.json();
  return data.scheduled_post as ScheduledPost;
}

export async function fetchScheduledPosts(businessId: string): Promise<ScheduledPost[]> {
  const response = await fetch(
    `${API_URL}/schedule?business_id=${encodeURIComponent(businessId)}`,
    { headers: defaultHeaders },
  );
  if (!response.ok) await handleErrorResponse(response);
  const data = await response.json();
  return (data.scheduled_posts ?? []) as ScheduledPost[];
}
