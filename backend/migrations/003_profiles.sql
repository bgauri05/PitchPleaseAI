-- ═══════════════════════════════════════════════════════════════════════
-- PitchPleaseAI — User Profiles Migration
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
--
-- WHAT: Frontend/src/contexts/AuthContext.tsx already queries a `profiles`
--       table (`.from('profiles').select('*').eq('id', userId)`) to decide
--       whether a logged-in user has finished business setup
--       (`profile.is_setup_complete`), and Frontend/src/app/pages/
--       AuthPage.tsx already routes on that flag after login/signup. That
--       table never existed, so `profile` was always null and every user
--       — new or returning — was silently routed to /setup forever, even
--       right after finishing it. This creates it and ties it to the
--       Supabase Auth user it belongs to.
--
--       Also adds `user_id` to `businesses` so a business can be owned by
--       a specific authenticated account rather than trusted purely from
--       an unauthenticated `business_id` value the frontend already had
--       in localStorage (see Frontend/src/app/components/ProtectedRoute.tsx).
-- ═══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS profiles (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id       UUID,
  business_name     TEXT,
  industry          TEXT,
  brand_voice       TEXT,
  languages         JSONB DEFAULT '[]'::jsonb,
  is_setup_complete BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- DROP + CREATE (not "IF NOT EXISTS" — Postgres policies don't support
-- that) so this whole file is safe to paste and run again even if it
-- partially ran before.
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Tie businesses to the account that created them. Nullable for backward
-- compatibility with any businesses created anonymously before this
-- migration — those keep working, they just aren't owned by anyone yet.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_businesses_user ON businesses (user_id);
