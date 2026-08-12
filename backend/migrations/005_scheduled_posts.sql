-- ═══════════════════════════════════════════════════════════════════════
-- PitchPleaseAI — Scheduled Posts Migration
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
--
-- WHAT: Backs the /api/v1/schedule endpoints (backend/app/api/v1/endpoints/
--       schedule.py) and the background scheduler (backend/app/services/
--       scheduler.py). Without this table, POST /api/v1/schedule and the
--       60-second scheduler tick both fail — this table did not exist yet
--       even though the code that reads/writes it was already committed.
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS scheduled_posts (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id     UUID NOT NULL,
  content         TEXT NOT NULL,
  image_url       TEXT,
  platform        TEXT NOT NULL,
  scheduled_time  TIMESTAMPTZ NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'posted', 'failed')),
  error_message   TEXT,
  -- Populated once check_due_posts() actually publishes the post — lets the
  -- UI link straight to the live Instagram post instead of just saying "posted".
  platform_post_id TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- The scheduler's every-60-seconds query is:
--   WHERE status = 'pending' AND scheduled_time <= now()
-- and the schedule.py list endpoint filters by business_id — index both.
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_due
  ON scheduled_posts (status, scheduled_time);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_business
  ON scheduled_posts (business_id);

-- RLS: the FastAPI backend talks to Supabase with the service-role key
-- (see backend/app/services/supabase.py), which bypasses RLS entirely, so
-- these policies don't affect the scheduler or the /schedule endpoints.
-- They only matter if the frontend ever queries this table directly with
-- the anon key (mirroring the pattern already used for generated_content
-- and weekly_plan) — enabled now so that path is safe by default rather
-- than open-by-omission.
ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;

-- DROP + CREATE (not "IF NOT EXISTS" — Postgres policies don't support
-- that) so this whole file is safe to paste and run again even if it
-- partially ran before. This is also what closes the "UNRESTRICTED /
-- RLS disabled" warning Supabase's table editor shows for a table that
-- has RLS off or zero policies.
DROP POLICY IF EXISTS "Owners can view their business's scheduled posts" ON scheduled_posts;
CREATE POLICY "Owners can view their business's scheduled posts"
  ON scheduled_posts FOR SELECT
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Owners can insert scheduled posts for their business" ON scheduled_posts;
CREATE POLICY "Owners can insert scheduled posts for their business"
  ON scheduled_posts FOR INSERT
  WITH CHECK (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Owners can update their business's scheduled posts" ON scheduled_posts;
CREATE POLICY "Owners can update their business's scheduled posts"
  ON scheduled_posts FOR UPDATE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Owners can delete their business's scheduled posts" ON scheduled_posts;
CREATE POLICY "Owners can delete their business's scheduled posts"
  ON scheduled_posts FOR DELETE
  USING (business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid()));
