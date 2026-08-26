import { supabase } from './supabase';
import { auth } from './firebase';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SavedContent {
  id: string;
  user_id: string;
  business_id: string | null;
  platform: string;
  content: string;
  image_prompt: string | null;
  topic: string | null;
  tone: string | null;
  created_at: string;
  title?: string;
  body?: string;
}

export interface WeeklyPlanItem {
  id: string;
  user_id: string;
  day_of_week: number;
  content_type: string;
  title: string;
  scheduled_time: string | null;
  platform: string | null;
  created_at: string;
}

// ── Content CRUD ─────────────────────────────────────────────────────────────

export async function saveGeneratedContent(
  items: { platform: string; content: string; image_prompt?: string; topic?: string; tone?: string }[],
  businessId?: string | null,
): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const rows = items.map((item) => ({
    user_id: user.uid,
    // WHAT: every other content-bearing table (brand_memory, scheduled_posts)
    // is scoped by business_id — this table previously only had user_id,
    // which is also what made fetchSavedContent()/getContentStats() below
    // unable to scope by business (they had nothing to filter on).
    business_id: businessId ?? null,
    platform: item.platform,
    content: item.content,
    image_prompt: item.image_prompt ?? null,
    topic: item.topic ?? null,
    tone: item.tone ?? null,
  }));

  await supabase.from('generated_content').insert(rows);
}

/**
 * WHAT: previously had NO filter at all — every logged-in user's Content
 * Library saw every business's generated content. `businessId` is required
 * now specifically to close that tenant-isolation gap; pass the current
 * business's id (e.g. `localStorage.getItem('business_id')`, same value
 * used everywhere else in the app) at every call site.
 */
export async function fetchSavedContent(businessId: string): Promise<SavedContent[]> {
  if (!businessId) return [];
  const { data, error } = await supabase
    .from('generated_content')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as SavedContent[];
}

export async function deleteContent(id: string, businessId: string): Promise<void> {
  // business_id filter prevents deleting a row that belongs to a different
  // business even if its id were guessed/known — defense in depth alongside
  // (eventually) a real RLS policy on this table.
  await supabase.from('generated_content').delete().eq('id', id).eq('business_id', businessId);
}

/** Same tenant-isolation fix as fetchSavedContent — see its comment. */
export async function getContentStats(businessId: string): Promise<{ total: number; thisWeek: number }> {
  if (!businessId) return { total: 0, thisWeek: 0 };
  const { data, error } = await supabase
    .from('generated_content')
    .select('created_at')
    .eq('business_id', businessId);
  if (error || !data) return { total: 0, thisWeek: 0 };

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thisWeek = data.filter((r) => new Date(r.created_at) >= weekAgo).length;

  return { total: data.length, thisWeek };
}

// ── Weekly Plan CRUD ─────────────────────────────────────────────────────────

export async function fetchWeeklyPlan(): Promise<WeeklyPlanItem[]> {
  const { data, error } = await supabase
    .from('weekly_plan')
    .select('*')
    .order('day_of_week', { ascending: true });
  if (error || !data) return [];
  return data as WeeklyPlanItem[];
}

export async function addPlanItem(
  item: { day_of_week: number; content_type: string; title: string; scheduled_time?: string; platform?: string },
): Promise<WeeklyPlanItem | null> {
  const user = auth.currentUser;
  if (!user) return null;

  const { data, error } = await supabase
    .from('weekly_plan')
    .insert({ user_id: user.uid, ...item })
    .select()
    .single();
  if (error || !data) return null;
  return data as WeeklyPlanItem;
}

export async function deletePlanItem(id: string): Promise<void> {
  await supabase.from('weekly_plan').delete().eq('id', id);
}
