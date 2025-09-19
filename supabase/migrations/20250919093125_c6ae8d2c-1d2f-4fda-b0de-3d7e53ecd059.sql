-- Create new tables for digital assets and experiences
CREATE TABLE IF NOT EXISTS public.digital_asset_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_redemption_id UUID NOT NULL,
  user_id UUID NOT NULL,
  asset_bucket TEXT NOT NULL,
  asset_key TEXT NOT NULL,
  download_url TEXT NOT NULL,
  accessed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.experience_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  template_description TEXT,
  duration_minutes INTEGER,
  max_participants INTEGER DEFAULT 1,
  requires_verification BOOLEAN DEFAULT true,
  template_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.experience_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL,
  verified_by_user_id UUID NOT NULL,
  verification_method TEXT NOT NULL DEFAULT 'qr_scan',
  verification_data JSONB DEFAULT '{}',
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  location_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);