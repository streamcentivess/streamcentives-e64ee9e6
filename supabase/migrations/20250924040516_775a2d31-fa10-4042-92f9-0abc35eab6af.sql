-- Create Streamseeker Artists table for artist eligibility and discovery pools
CREATE TABLE public.streamseeker_artists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  eligibility_status TEXT NOT NULL DEFAULT 'pending',
  discovery_pool TEXT NOT NULL DEFAULT 'up_and_coming',
  pro_registration_info JSONB DEFAULT '{}',
  profile_completion_score INTEGER DEFAULT 0,
  content_count INTEGER DEFAULT 0,
  social_links_count INTEGER DEFAULT 0,
  total_discoveries INTEGER DEFAULT 0,
  total_follows_from_discovery INTEGER DEFAULT 0,
  last_discovered_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Streamseeker Discoveries table to track fan discovery history
CREATE TABLE public.streamseeker_discoveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fan_id UUID NOT NULL,
  artist_id UUID NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'music',
  engagement_completed BOOLEAN DEFAULT false,
  followed BOOLEAN DEFAULT false,
  skipped BOOLEAN DEFAULT false,
  xp_earned INTEGER DEFAULT 0,
  engagement_duration_seconds INTEGER DEFAULT 0,
  discovery_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create Streamseeker Daily Quests table
CREATE TABLE public.streamseeker_daily_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quest_date DATE DEFAULT CURRENT_DATE,
  discoveries_completed INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  quest_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_date)
);

-- Create Streamseeker Checklist table for artist onboarding
CREATE TABLE public.streamseeker_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL,
  pro_registration BOOLEAN DEFAULT false,
  profile_complete BOOLEAN DEFAULT false,
  social_media_linked BOOLEAN DEFAULT false,
  content_uploaded BOOLEAN DEFAULT false,
  checklist_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(artist_id)
);

-- Enable RLS on all tables
ALTER TABLE public.streamseeker_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streamseeker_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streamseeker_daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streamseeker_checklist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for streamseeker_artists
CREATE POLICY "Artists can manage their own streamseeker profile"
ON public.streamseeker_artists
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can manage streamseeker artists"
ON public.streamseeker_artists
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for streamseeker_discoveries
CREATE POLICY "Fans can view their own discoveries"
ON public.streamseeker_discoveries
FOR SELECT
USING (auth.uid() = fan_id);

CREATE POLICY "Fans can create discoveries"
ON public.streamseeker_discoveries
FOR INSERT
WITH CHECK (auth.uid() = fan_id);

CREATE POLICY "System can manage discoveries"
ON public.streamseeker_discoveries
FOR ALL
USING (true)
WITH CHECK (true);

-- RLS Policies for streamseeker_daily_quests
CREATE POLICY "Users can manage their own daily quests"
ON public.streamseeker_daily_quests
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for streamseeker_checklist
CREATE POLICY "Artists can manage their own checklist"
ON public.streamseeker_checklist
FOR ALL
USING (auth.uid() = artist_id)
WITH CHECK (auth.uid() = artist_id);

-- Function to update artist eligibility based on checklist
CREATE OR REPLACE FUNCTION public.update_artist_eligibility(artist_user_id UUID)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  checklist_record public.streamseeker_checklist;
  total_score INTEGER := 0;
  new_status TEXT := 'pending';
  new_pool TEXT := 'up_and_coming';
BEGIN
  -- Get checklist data
  SELECT * INTO checklist_record
  FROM public.streamseeker_checklist
  WHERE artist_id = artist_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Checklist not found');
  END IF;
  
  -- Calculate score
  IF checklist_record.pro_registration THEN total_score := total_score + 25; END IF;
  IF checklist_record.profile_complete THEN total_score := total_score + 25; END IF;
  IF checklist_record.social_media_linked THEN total_score := total_score + 25; END IF;
  IF checklist_record.content_uploaded THEN total_score := total_score + 25; END IF;
  
  -- Determine eligibility status
  IF total_score >= 100 THEN
    new_status := 'approved';
  ELSIF total_score >= 75 THEN
    new_status := 'review';
  ELSE
    new_status := 'pending';
  END IF;
  
  -- Update checklist score
  UPDATE public.streamseeker_checklist
  SET checklist_score = total_score,
      updated_at = now()
  WHERE artist_id = artist_user_id;
  
  -- Update or create streamseeker artist record
  INSERT INTO public.streamseeker_artists (
    user_id, eligibility_status, discovery_pool, profile_completion_score,
    approved_at
  ) VALUES (
    artist_user_id, new_status, new_pool, total_score,
    CASE WHEN new_status = 'approved' THEN now() ELSE NULL END
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    eligibility_status = new_status,
    profile_completion_score = total_score,
    approved_at = CASE WHEN new_status = 'approved' AND streamseeker_artists.eligibility_status != 'approved' THEN now() ELSE streamseeker_artists.approved_at END,
    updated_at = now();
  
  RETURN json_build_object(
    'success', true,
    'status', new_status,
    'score', total_score,
    'pool', new_pool
  );
END;
$$;

-- Function to get streamseeker suggestions for fans
CREATE OR REPLACE FUNCTION public.get_streamseeker_suggestions(
  fan_user_id UUID,
  content_type_param TEXT DEFAULT 'music',
  exclude_discovered BOOLEAN DEFAULT true
)
RETURNS TABLE(
  artist_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  discovery_pool TEXT,
  content_count INTEGER,
  follower_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    sa.discovery_pool,
    sa.content_count,
    COALESCE(fc.follower_count, 0) as follower_count
  FROM public.streamseeker_artists sa
  JOIN public.profiles p ON p.user_id = sa.user_id
  LEFT JOIN (
    SELECT following_id, COUNT(*) as follower_count
    FROM public.follows
    GROUP BY following_id
  ) fc ON fc.following_id = sa.user_id
  WHERE sa.eligibility_status = 'approved'
    AND sa.user_id != fan_user_id
    AND (
      NOT exclude_discovered OR
      NOT EXISTS (
        SELECT 1 FROM public.streamseeker_discoveries sd
        WHERE sd.fan_id = fan_user_id 
          AND sd.artist_id = sa.user_id
          AND sd.discovery_date = CURRENT_DATE
      )
    )
  ORDER BY RANDOM()
  LIMIT 1;
END;
$$;

-- Function to complete a streamseeker discovery
CREATE OR REPLACE FUNCTION public.complete_streamseeker_discovery(
  fan_user_id UUID,
  artist_user_id UUID,
  content_type_param TEXT DEFAULT 'music',
  engagement_completed_param BOOLEAN DEFAULT false,
  followed_param BOOLEAN DEFAULT false,
  engagement_duration_param INTEGER DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  base_xp INTEGER := 10;
  engagement_xp INTEGER := 20;
  follow_xp INTEGER := 50;
  total_xp INTEGER := 0;
  discovery_id UUID;
BEGIN
  -- Calculate XP rewards
  total_xp := base_xp;
  
  IF engagement_completed_param THEN
    total_xp := total_xp + engagement_xp;
  END IF;
  
  IF followed_param THEN
    total_xp := total_xp + follow_xp;
  END IF;
  
  -- Create discovery record
  INSERT INTO public.streamseeker_discoveries (
    fan_id, artist_id, content_type, engagement_completed, followed,
    xp_earned, engagement_duration_seconds
  ) VALUES (
    fan_user_id, artist_user_id, content_type_param, engagement_completed_param,
    followed_param, total_xp, engagement_duration_param
  ) RETURNING id INTO discovery_id;
  
  -- Award XP to fan
  INSERT INTO public.user_xp_balances (user_id, current_xp, total_earned_xp)
  VALUES (fan_user_id, total_xp, total_xp)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    current_xp = user_xp_balances.current_xp + total_xp,
    total_earned_xp = user_xp_balances.total_earned_xp + total_xp,
    updated_at = now();
  
  -- Update daily quest progress
  INSERT INTO public.streamseeker_daily_quests (
    user_id, discoveries_completed, total_xp_earned
  ) VALUES (
    fan_user_id, 1, total_xp
  )
  ON CONFLICT (user_id, quest_date)
  DO UPDATE SET
    discoveries_completed = streamseeker_daily_quests.discoveries_completed + 1,
    total_xp_earned = streamseeker_daily_quests.total_xp_earned + total_xp,
    quest_completed = CASE 
      WHEN streamseeker_daily_quests.discoveries_completed + 1 >= 3 THEN true
      ELSE false
    END;
  
  -- Update artist discovery stats
  UPDATE public.streamseeker_artists
  SET total_discoveries = total_discoveries + 1,
      total_follows_from_discovery = total_follows_from_discovery + CASE WHEN followed_param THEN 1 ELSE 0 END,
      last_discovered_at = now()
  WHERE user_id = artist_user_id;
  
  RETURN json_build_object(
    'success', true,
    'discovery_id', discovery_id,
    'xp_earned', total_xp,
    'engagement_completed', engagement_completed_param,
    'followed', followed_param
  );
END;
$$;