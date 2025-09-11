-- Create comprehensive sharing and XP tracking system
CREATE TABLE IF NOT EXISTS public.share_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'profile', 'reward', 'campaign')),
  content_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'facebook', 'instagram', 'sms', 'email', 'streamcentives')),
  share_url TEXT NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_daily_share UNIQUE (user_id, content_type, content_id, platform, date_trunc('day', created_at))
);

-- Enable RLS
ALTER TABLE public.share_activities ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own share activities" 
ON public.share_activities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own share activities" 
ON public.share_activities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to handle universal sharing with XP tracking
CREATE OR REPLACE FUNCTION public.handle_universal_share(
  content_type_param TEXT,
  content_id_param UUID,
  platform_param TEXT,
  share_url_param TEXT
) RETURNS JSON AS $$
DECLARE
  user_uuid UUID;
  existing_share RECORD;
  recent_share RECORD;
  xp_to_award INTEGER := 0;
  platform_xp_values JSONB := '{"twitter": 10, "facebook": 8, "instagram": 12, "sms": 5, "email": 6, "streamcentives": 15}';
  result JSON;
BEGIN
  -- Get authenticated user
  user_uuid := auth.uid();
  IF user_uuid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if user already shared this content on this platform today
  SELECT * INTO existing_share 
  FROM public.share_activities 
  WHERE user_id = user_uuid 
    AND content_type = content_type_param 
    AND content_id = content_id_param 
    AND platform = platform_param 
    AND date_trunc('day', created_at) = date_trunc('day', now());

  IF existing_share IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already shared on this platform today');
  END IF;

  -- Check for spam prevention (same content within 7 days)
  SELECT * INTO recent_share 
  FROM public.share_activities 
  WHERE user_id = user_uuid 
    AND content_type = content_type_param 
    AND content_id = content_id_param 
    AND platform = platform_param 
    AND created_at > (now() - interval '7 days');

  IF recent_share IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Must wait 7 days before resharing the same content on this platform');
  END IF;

  -- Calculate XP to award
  xp_to_award := COALESCE((platform_xp_values ->> platform_param)::INTEGER, 5);

  -- Insert share activity
  INSERT INTO public.share_activities (
    user_id, content_type, content_id, platform, share_url, xp_earned
  ) VALUES (
    user_uuid, content_type_param, content_id_param, platform_param, share_url_param, xp_to_award
  );

  -- Update user's XP balance
  INSERT INTO public.user_xp_balances (user_id, current_xp, total_earned_xp)
  VALUES (user_uuid, xp_to_award, xp_to_award)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    current_xp = user_xp_balances.current_xp + xp_to_award,
    total_earned_xp = user_xp_balances.total_earned_xp + xp_to_award,
    updated_at = now();

  result := json_build_object(
    'success', true, 
    'xp_earned', xp_to_award,
    'message', 'Shared successfully! Earned ' || xp_to_award || ' XP'
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_share_activities_user_content_platform_date 
ON public.share_activities (user_id, content_type, content_id, platform, date_trunc('day', created_at));

CREATE INDEX IF NOT EXISTS idx_share_activities_spam_check 
ON public.share_activities (user_id, content_type, content_id, platform, created_at DESC);