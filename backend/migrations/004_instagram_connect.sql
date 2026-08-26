-- ═══════════════════════════════════════════════════════════════════════
-- PitchPleaseAI — Instagram Connect Migration
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
--
-- WHAT: backend/app/api/v1/endpoints/instagram.py's OAuth callback writes
--       instagram_access_token + instagram_user_id onto the businesses
--       row for the business that just connected. Neither column existed
--       yet — the callback would fail on the final .update() call.
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS instagram_access_token TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS instagram_user_id TEXT;

-- Set when the token was issued so the frontend/scheduler can warn before
-- the ~60-day long-lived token expires (Meta does not auto-refresh these;
-- see backend/app/services/instagram_publish.py for the refresh helper).
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS instagram_token_updated_at TIMESTAMPTZ;
