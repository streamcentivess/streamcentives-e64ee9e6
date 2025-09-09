-- Create post_share_settings table for creator XP configuration
CREATE TABLE public.post_share_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  on_platform_xp INTEGER NOT NULL DEFAULT 5,
  off_platform_xp INTEGER NOT NULL DEFAULT 10,
  is_shareable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_shares table for tracking shares
CREATE TABLE public.post_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  fan_id UUID NOT NULL,
  share_type TEXT NOT NULL CHECK (share_type IN ('on_platform', 'off_platform')),
  xp_earned INTEGER NOT NULL DEFAULT 0,
  platform TEXT, -- For off-platform shares (twitter, facebook, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Ensure one share per post per fan per day
  UNIQUE(post_id, fan_id, DATE(created_at))
);

-- Create campaign_share_settings table
CREATE TABLE public.campaign_share_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  on_platform_xp INTEGER NOT NULL DEFAULT 10,
  off_platform_xp INTEGER NOT NULL DEFAULT 20,
  is_shareable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reward_share_settings table
CREATE TABLE public.reward_share_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  on_platform_xp INTEGER NOT NULL DEFAULT 5,
  off_platform_xp INTEGER NOT NULL DEFAULT 15,
  is_shareable BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.post_share_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_share_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_share_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_share_settings
CREATE POLICY "Creators can manage their post share settings" 
ON public.post_share_settings 
FOR ALL 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can view post share settings" 
ON public.post_share_settings 
FOR SELECT 
USING (true);

-- RLS Policies for post_shares
CREATE POLICY "Users can create their own shares" 
ON public.post_shares 
FOR INSERT 
WITH CHECK (auth.uid() = fan_id);

CREATE POLICY "Users can view their own shares" 
ON public.post_shares 
FOR SELECT 
USING (auth.uid() = fan_id OR auth.uid() = creator_id);

-- RLS Policies for campaign_share_settings
CREATE POLICY "Creators can manage their campaign share settings" 
ON public.campaign_share_settings 
FOR ALL 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can view campaign share settings" 
ON public.campaign_share_settings 
FOR SELECT 
USING (true);

-- RLS Policies for reward_share_settings
CREATE POLICY "Creators can manage their reward share settings" 
ON public.reward_share_settings 
FOR ALL 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can view reward share settings" 
ON public.reward_share_settings 
FOR SELECT 
USING (true);

-- Create triggers for updated_at
CREATE TRIGGER update_post_share_settings_updated_at
BEFORE UPDATE ON public.post_share_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_share_settings_updated_at
BEFORE UPDATE ON public.campaign_share_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reward_share_settings_updated_at
BEFORE UPDATE ON public.reward_share_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle sharing with XP rewards
CREATE OR REPLACE FUNCTION public.handle_post_share(
  post_id_param UUID,
  share_type_param TEXT,
  platform_param TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  fan_id UUID;
  creator_id UUID;
  share_settings RECORD;
  xp_to_award INTEGER;
  existing_share_count INTEGER;
  result JSON;
BEGIN
  fan_id := auth.uid();
  
  -- Get post creator
  SELECT user_id INTO creator_id FROM public.posts WHERE id = post_id_param;
  
  IF creator_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Post not found');
  END IF;
  
  -- Fans can't share their own content for XP
  IF fan_id = creator_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot earn XP from sharing your own content');
  END IF;
  
  -- Check if already shared today
  SELECT COUNT(*) INTO existing_share_count
  FROM public.post_shares
  WHERE post_id = post_id_param 
    AND fan_id = fan_id 
    AND DATE(created_at) = CURRENT_DATE;
    
  IF existing_share_count > 0 THEN
    RETURN json_build_object('success', false, 'error', 'You can only share this post once per day');
  END IF;
  
  -- Get share settings
  SELECT * INTO share_settings
  FROM public.post_share_settings
  WHERE post_id = post_id_param;
  
  -- If no settings exist, create default ones
  IF share_settings IS NULL THEN
    INSERT INTO public.post_share_settings (post_id, creator_id)
    VALUES (post_id_param, creator_id);
    
    SELECT * INTO share_settings
    FROM public.post_share_settings
    WHERE post_id = post_id_param;
  END IF;
  
  -- Check if sharing is enabled
  IF NOT share_settings.is_shareable THEN
    RETURN json_build_object('success', false, 'error', 'Sharing is disabled for this post');
  END IF;
  
  -- Determine XP amount
  IF share_type_param = 'on_platform' THEN
    xp_to_award := share_settings.on_platform_xp;
  ELSE
    xp_to_award := share_settings.off_platform_xp;
  END IF;
  
  -- Record the share
  INSERT INTO public.post_shares (post_id, creator_id, fan_id, share_type, xp_earned, platform)
  VALUES (post_id_param, creator_id, fan_id, share_type_param, xp_to_award, platform_param);
  
  -- Award XP to fan
  INSERT INTO public.user_xp_balances (user_id, current_xp, total_earned_xp)
  VALUES (fan_id, xp_to_award, xp_to_award)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    current_xp = user_xp_balances.current_xp + xp_to_award,
    total_earned_xp = user_xp_balances.total_earned_xp + xp_to_award,
    updated_at = now();
  
  RETURN json_build_object(
    'success', true, 
    'xp_earned', xp_to_award,
    'share_type', share_type_param
  );
END;
$$;