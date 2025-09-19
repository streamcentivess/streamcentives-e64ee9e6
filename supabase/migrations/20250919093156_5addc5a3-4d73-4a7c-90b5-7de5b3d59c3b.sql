-- Enable RLS and add security policies for the new tables
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
  JOIN public.reward_redemptions rr ON rr.id = e.reward_redemption_id
  JOIN public.rewards r ON r.id = rr.reward_id
  WHERE e.id = experience_verifications.experience_id 
  AND r.creator_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.experiences e
  JOIN public.reward_redemptions rr ON rr.id = e.reward_redemption_id
  JOIN public.rewards r ON r.id = rr.reward_id
  WHERE e.id = experience_verifications.experience_id 
  AND r.creator_id = auth.uid()
));

CREATE POLICY "Users can view verifications for their experiences"
ON public.experience_verifications FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.experiences e
  WHERE e.id = experience_verifications.experience_id 
  AND e.fan_id = auth.uid()
));

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_digital_asset_logs_user_id ON public.digital_asset_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_asset_logs_redemption_id ON public.digital_asset_access_logs(reward_redemption_id);
CREATE INDEX IF NOT EXISTS idx_experience_templates_creator_id ON public.experience_templates(creator_id);
CREATE INDEX IF NOT EXISTS idx_experience_verifications_experience_id ON public.experience_verifications(experience_id);