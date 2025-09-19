-- First, enhance the rewards table
ALTER TABLE public.rewards 
ADD COLUMN IF NOT EXISTS digital_asset_bucket TEXT,
ADD COLUMN IF NOT EXISTS digital_asset_key TEXT,
ADD COLUMN IF NOT EXISTS asset_expiry_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS experience_template_id UUID;