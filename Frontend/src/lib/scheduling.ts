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
