-- ═══════════════════════════════════════════════════════════════════════
-- BrandSetu — Supabase Migration
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ═══════════════════════════════════════════════════════════════════════

-- 1) generated_content — stores every AI-generated piece of content
CREATE TABLE IF NOT EXISTS generated_content (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform    TEXT NOT NULL,
  content     TEXT NOT NULL,
  image_prompt TEXT,
  topic       TEXT,
  tone        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE generated_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own content"
  ON generated_content FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content"
  ON generated_content FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own content"
  ON generated_content FOR DELETE
  USING (auth.uid() = user_id);


-- 2) weekly_plan — stores content plan items per day-of-week
CREATE TABLE IF NOT EXISTS weekly_plan (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week   INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  content_type  TEXT NOT NULL,
  title         TEXT NOT NULL,
  scheduled_time TEXT,
  platform      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE weekly_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans"
  ON weekly_plan FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans"
  ON weekly_plan FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans"
  ON weekly_plan FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans"
  ON weekly_plan FOR DELETE
  USING (auth.uid() = user_id);


-- 3) businesses — stores Brand Memory and business profile information
CREATE TABLE IF NOT EXISTS businesses (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                  TEXT,
  business_name         TEXT,
  industry              TEXT,
  business_description  TEXT,
  brand_voice           JSONB DEFAULT '[]'::jsonb,
  brand_values          JSONB DEFAULT '[]'::jsonb,
  target_audience       TEXT,
  products_services     TEXT,
  logo_url              TEXT,
  brand_images          JSONB DEFAULT '[]'::jsonb,
  ai_instructions       TEXT,
  tone                  TEXT,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Ensure newly added columns exist if table was previously created
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_description TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS brand_voice JSONB DEFAULT '[]'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS brand_values JSONB DEFAULT '[]'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS products_services TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS brand_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ai_instructions TEXT;

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own business"
  ON businesses FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own business"
  ON businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own business"
  ON businesses FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL);

