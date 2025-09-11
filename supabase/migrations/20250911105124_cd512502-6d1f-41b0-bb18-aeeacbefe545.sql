-- Create campaign interactions table for different campaign types
CREATE TABLE public.campaign_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  user_id UUID NOT NULL,
  interaction_type TEXT NOT NULL, -- 'purchase', 'stream', 'upload', 'share', 'vote'
  interaction_data JSONB, -- Store specific data like purchase_url, upload_url, poll_choice, etc.
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- Create campaign assets table for storing posts, polls, etc.
CREATE TABLE public.campaign_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  asset_type TEXT NOT NULL, -- 'post', 'poll', 'upload_template'
  asset_data JSONB NOT NULL, -- Store post content, poll options, upload requirements
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create poll votes table
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL,
  user_id UUID NOT NULL,
  poll_option TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- Enable RLS
ALTER TABLE public.campaign_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for campaign_interactions
CREATE POLICY "Users can manage their own interactions" 
ON public.campaign_interactions 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Creators can view interactions for their campaigns" 
ON public.campaign_interactions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM campaigns c 
  WHERE c.id = campaign_interactions.campaign_id 
  AND c.creator_id = auth.uid()
));

-- RLS policies for campaign_assets  
CREATE POLICY "Everyone can view campaign assets" 
ON public.campaign_assets 
FOR SELECT 
USING (true);

CREATE POLICY "Creators can manage their campaign assets" 
ON public.campaign_assets 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM campaigns c 
  WHERE c.id = campaign_assets.campaign_id 
  AND c.creator_id = auth.uid()
));

-- RLS policies for poll_votes
CREATE POLICY "Users can manage their own poll votes" 
ON public.poll_votes 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view poll results" 
ON public.poll_votes 
FOR SELECT 
USING (true);

-- Create trigger for updating timestamps
CREATE TRIGGER update_campaign_interactions_updated_at
BEFORE UPDATE ON public.campaign_interactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_assets_updated_at
BEFORE UPDATE ON public.campaign_assets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to complete campaign interaction and award XP
CREATE OR REPLACE FUNCTION public.complete_campaign_interaction(
  campaign_id_param UUID,
  interaction_data_param JSONB DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_uuid UUID;
  campaign_record RECORD;
  interaction_record RECORD;
  result JSON;
BEGIN
  user_uuid := auth.uid();
  
  -- Get campaign details
  SELECT * INTO campaign_record
  FROM public.campaigns
  WHERE id = campaign_id_param AND status = 'active';
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Campaign not found or not active');
  END IF;
  
  -- Check if user has joined the campaign
  IF NOT EXISTS (
    SELECT 1 FROM public.campaign_participants 
    WHERE campaign_id = campaign_id_param AND user_id = user_uuid
  ) THEN
    RETURN json_build_object('success', false, 'error', 'User has not joined this campaign');
  END IF;
  
  -- Update or create interaction record
  INSERT INTO public.campaign_interactions (
    campaign_id, user_id, interaction_type, interaction_data, completed, completed_at
  )
  VALUES (
    campaign_id_param, 
    user_uuid, 
    campaign_record.type,
    interaction_data_param,
    true,
    now()
  )
  ON CONFLICT (campaign_id, user_id)
  DO UPDATE SET
    completed = true,
    completed_at = now(),
    interaction_data = COALESCE(interaction_data_param, campaign_interactions.interaction_data),
    updated_at = now();
  
  -- Award XP to user
  IF campaign_record.xp_reward > 0 THEN
    INSERT INTO public.user_xp_balances (user_id, current_xp, total_earned_xp)
    VALUES (user_uuid, campaign_record.xp_reward, campaign_record.xp_reward)
    ON CONFLICT (user_id)
    DO UPDATE SET 
      current_xp = user_xp_balances.current_xp + campaign_record.xp_reward,
      total_earned_xp = user_xp_balances.total_earned_xp + campaign_record.xp_reward,
      updated_at = now();
  END IF;
  
  -- Update campaign participant status
  UPDATE public.campaign_participants
  SET 
    status = 'completed',
    progress = 100,
    xp_earned = campaign_record.xp_reward,
    cash_earned = campaign_record.cash_reward,
    completion_date = now(),
    updated_at = now()
  WHERE campaign_id = campaign_id_param AND user_id = user_uuid;
  
  -- Update campaign progress
  UPDATE public.campaigns
  SET 
    current_progress = current_progress + 1,
    updated_at = now()
  WHERE id = campaign_id_param;
  
  -- Update leaderboard
  INSERT INTO public.creator_fan_leaderboards (
    creator_user_id, fan_user_id, total_listens, total_xp_earned, last_activity_at
  )
  VALUES (
    campaign_record.creator_id, user_uuid, 0, campaign_record.xp_reward, now()
  )
  ON CONFLICT (creator_user_id, fan_user_id)
  DO UPDATE SET
    total_xp_earned = creator_fan_leaderboards.total_xp_earned + campaign_record.xp_reward,
    last_activity_at = now(),
    updated_at = now();
  
  RETURN json_build_object(
    'success', true,
    'xp_awarded', campaign_record.xp_reward,
    'message', 'Campaign completed successfully!'
  );
END;
$$;