-- Add boost scoring system for Creator Pro subscribers

-- Add boost-related columns to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN boost_score INTEGER DEFAULT 0,
ADD COLUMN is_boosted BOOLEAN DEFAULT false,
ADD COLUMN boost_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN boost_multiplier DECIMAL(3,2) DEFAULT 1.0;

-- Add boost tracking to profiles
ALTER TABLE public.profiles
ADD COLUMN profile_boost_score INTEGER DEFAULT 0,
ADD COLUMN total_boosts_received INTEGER DEFAULT 0,
ADD COLUMN last_boost_at TIMESTAMP WITH TIME ZONE;

-- Create campaign boost tracking table
CREATE TABLE public.campaign_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  creator_id UUID NOT NULL,
  boost_type TEXT NOT NULL DEFAULT 'creator_pro',
  boost_amount INTEGER NOT NULL DEFAULT 100,
  boost_duration_hours INTEGER NOT NULL DEFAULT 168, -- 7 days
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- Create algorithm scoring function
CREATE OR REPLACE FUNCTION public.calculate_campaign_visibility_score(campaign_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  base_score INTEGER := 0;
  boost_multiplier DECIMAL := 1.0;
  time_factor DECIMAL := 1.0;
  engagement_score INTEGER := 0;
  final_score INTEGER := 0;
  campaign_age_hours INTEGER;
  active_boosts INTEGER := 0;
BEGIN
  -- Get campaign data and calculate base score
  SELECT 
    COALESCE(c.current_progress * 10, 0) +
    COALESCE(c.xp_reward / 10, 0) +
    CASE WHEN c.cash_reward > 0 THEN 50 ELSE 0 END +
    EXTRACT(EPOCH FROM (now() - c.created_at)) / 3600, -- Age in hours
    c.boost_multiplier,
    EXTRACT(EPOCH FROM (now() - c.created_at)) / 3600
  INTO base_score, boost_multiplier, campaign_age_hours
  FROM public.campaigns c
  WHERE c.id = campaign_id_param;
  
  -- Calculate engagement score from participants
  SELECT COUNT(*) * 20 INTO engagement_score
  FROM public.campaign_participants cp
  WHERE cp.campaign_id = campaign_id_param;
  
  -- Time decay factor (newer campaigns get higher scores)
  time_factor := GREATEST(0.1, 1.0 - (campaign_age_hours / 168.0)); -- 7-day decay
  
  -- Check for active boosts
  SELECT COUNT(*) INTO active_boosts
  FROM public.campaign_boosts cb
  WHERE cb.campaign_id = campaign_id_param 
    AND cb.is_active = true 
    AND cb.expires_at > now();
  
  -- Apply boost multiplier for active boosts
  IF active_boosts > 0 THEN
    boost_multiplier := boost_multiplier + (active_boosts * 0.5);
  END IF;
  
  -- Calculate final visibility score
  final_score := ROUND((base_score + engagement_score) * time_factor * boost_multiplier);
  
  -- Update campaign with calculated score
  UPDATE public.campaigns
  SET boost_score = final_score
  WHERE id = campaign_id_param;
  
  RETURN final_score;
END;
$$;

-- Function to apply Creator Pro boost
CREATE OR REPLACE FUNCTION public.apply_creator_pro_boost(campaign_id_param UUID, creator_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_pro_subscriber BOOLEAN := false;
  boost_duration INTEGER := 168; -- 7 days in hours
  boost_amount INTEGER := 200;
  new_boost_id UUID;
  visibility_score INTEGER;
BEGIN
  -- Check if user has active Creator Pro subscription
  SELECT EXISTS(
    SELECT 1 FROM public.ai_tool_subscriptions ats
    WHERE ats.user_id = creator_id_param 
      AND ats.tool_name = 'creator_pro'
      AND ats.status = 'active'
  ) INTO is_pro_subscriber;
  
  IF NOT is_pro_subscriber THEN
    RETURN json_build_object('success', false, 'error', 'Creator Pro subscription required');
  END IF;
  
  -- Create boost record
  INSERT INTO public.campaign_boosts (
    campaign_id, creator_id, boost_type, boost_amount, 
    boost_duration_hours, expires_at
  ) VALUES (
    campaign_id_param, creator_id_param, 'creator_pro', boost_amount,
    boost_duration, now() + (boost_duration || ' hours')::INTERVAL
  ) RETURNING id INTO new_boost_id;
  
  -- Update campaign as boosted
  UPDATE public.campaigns
  SET 
    is_boosted = true,
    boost_expires_at = now() + (boost_duration || ' hours')::INTERVAL,
    boost_multiplier = boost_multiplier + 1.0
  WHERE id = campaign_id_param;
  
  -- Update creator profile boost stats
  UPDATE public.profiles
  SET 
    total_boosts_received = total_boosts_received + 1,
    last_boost_at = now(),
    profile_boost_score = profile_boost_score + 50
  WHERE user_id = creator_id_param;
  
  -- Calculate new visibility score
  SELECT public.calculate_campaign_visibility_score(campaign_id_param) INTO visibility_score;
  
  RETURN json_build_object(
    'success', true,
    'boost_id', new_boost_id,
    'boost_amount', boost_amount,
    'boost_duration_hours', boost_duration,
    'new_visibility_score', visibility_score
  );
END;
$$;

-- Enable RLS on new tables
ALTER TABLE public.campaign_boosts ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaign_boosts
CREATE POLICY "Creators can view their campaign boosts"
ON public.campaign_boosts
FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "System can manage campaign boosts"
ON public.campaign_boosts
FOR ALL
USING (true)
WITH CHECK (true);

-- Update campaigns RLS to show boosted campaigns higher in feeds
CREATE OR REPLACE VIEW public.boosted_campaigns AS
SELECT 
  c.*,
  COALESCE(c.boost_score, 0) as visibility_score,
  CASE WHEN c.is_boosted AND c.boost_expires_at > now() THEN true ELSE false END as currently_boosted,
  cb.boost_amount,
  cb.expires_at as boost_expires
FROM public.campaigns c
LEFT JOIN public.campaign_boosts cb ON c.id = cb.campaign_id AND cb.is_active = true AND cb.expires_at > now()
ORDER BY 
  CASE WHEN c.is_boosted AND c.boost_expires_at > now() THEN 1 ELSE 0 END DESC,
  COALESCE(c.boost_score, 0) DESC,
  c.created_at DESC;