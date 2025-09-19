-- Enhance rewards table for digital assets and experiences
ALTER TABLE public.rewards 
ADD COLUMN IF NOT EXISTS digital_asset_bucket TEXT,
ADD COLUMN IF NOT EXISTS digital_asset_key TEXT,
ADD COLUMN IF NOT EXISTS asset_expiry_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS experience_template_id UUID;

-- Create digital asset access logs table
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

-- Create experience templates table
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

-- Create experience verifications table
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

-- Enable RLS on new tables
ALTER TABLE public.digital_asset_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_verifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for digital_asset_access_logs
CREATE POLICY "Users can view their own asset access logs"
ON public.digital_asset_access_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create asset access logs"
ON public.digital_asset_access_logs FOR INSERT
WITH CHECK (true);

-- RLS policies for experience_templates
CREATE POLICY "Creators can manage their experience templates"
ON public.experience_templates FOR ALL
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can view active experience templates"
ON public.experience_templates FOR SELECT
USING (is_active = true);

-- RLS policies for experience_verifications
CREATE POLICY "Creators can verify experiences for their rewards"
ON public.experience_verifications FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.experiences e
  JOIN public.rewards r ON r.id = e.reward_id
  WHERE e.id = experience_verifications.experience_id 
  AND r.creator_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.experiences e
  JOIN public.rewards r ON r.id = e.reward_id
  WHERE e.id = experience_verifications.experience_id 
  AND r.creator_id = auth.uid()
));

CREATE POLICY "Users can view verifications for their experiences"
ON public.experience_verifications FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.experiences e
  WHERE e.id = experience_verifications.experience_id 
  AND e.user_id = auth.uid()
));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_digital_asset_logs_user_id ON public.digital_asset_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_asset_logs_redemption_id ON public.digital_asset_access_logs(reward_redemption_id);
CREATE INDEX IF NOT EXISTS idx_experience_templates_creator_id ON public.experience_templates(creator_id);
CREATE INDEX IF NOT EXISTS idx_experience_verifications_experience_id ON public.experience_verifications(experience_id);