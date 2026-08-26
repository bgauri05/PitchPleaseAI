-- ═══════════════════════════════════════════════════════════════════════
-- BrandSetu — Brand Memory Migration (Backward Compatible)
-- Add rich Brand Memory fields to businesses table
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_description TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS brand_voice JSONB DEFAULT '[]'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS brand_values JSONB DEFAULT '[]'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS products_services TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS brand_images JSONB DEFAULT '[]'::jsonb;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS ai_instructions TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill legacy records: copy `name` to `business_name` if null
UPDATE businesses 
SET business_name = name 
WHERE business_name IS NULL AND name IS NOT NULL;

-- Backfill legacy records: convert `tone` string into `brand_voice` array if brand_voice is empty
UPDATE businesses 
SET brand_voice = jsonb_build_array(tone) 
WHERE (brand_voice IS NULL OR brand_voice = '[]'::jsonb) AND tone IS NOT NULL AND tone != '';
