-- Create table for tracking Spotify listens
CREATE TABLE public.spotify_listens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fan_user_id UUID NOT NULL,
  creator_user_id UUID NOT NULL,
  track_id TEXT NOT NULL,
  track_name TEXT,
  artist_name TEXT,
  listened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  duration_ms INTEGER,
  progress_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for creator-fan leaderboards
CREATE TABLE public.creator_fan_leaderboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_user_id UUID NOT NULL,
  fan_user_id UUID NOT NULL,
  total_listens INTEGER NOT NULL DEFAULT 0,
  total_xp_earned INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  rank_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(creator_user_id, fan_user_id)
);

-- Enable Row Level Security
ALTER TABLE public.spotify_listens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_fan_leaderboards ENABLE ROW LEVEL SECURITY;

-- Create policies for spotify_listens
CREATE POLICY "Users can insert their own listens" 
ON public.spotify_listens 
FOR INSERT 
WITH CHECK (auth.uid() = fan_user_id);

CREATE POLICY "Users can view their own listens" 
ON public.spotify_listens 
FOR SELECT 
USING (auth.uid() = fan_user_id);

CREATE POLICY "Creators can view listens for their content" 
ON public.spotify_listens 
FOR SELECT 
USING (auth.uid() = creator_user_id);

-- Create policies for creator_fan_leaderboards
CREATE POLICY "Creators can view their leaderboards" 
ON public.creator_fan_leaderboards 
FOR SELECT 
USING (auth.uid() = creator_user_id);

CREATE POLICY "Fans can view their own leaderboard entries" 
ON public.creator_fan_leaderboards 
FOR SELECT 
USING (auth.uid() = fan_user_id);

CREATE POLICY "System can manage leaderboard entries" 
ON public.creator_fan_leaderboards 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_leaderboards_updated_at
BEFORE UPDATE ON public.creator_fan_leaderboards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update leaderboard when new listen is recorded
CREATE OR REPLACE FUNCTION public.update_leaderboard_on_listen()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert leaderboard entry
  INSERT INTO public.creator_fan_leaderboards (
    creator_user_id,
    fan_user_id,
    total_listens,
    total_xp_earned,
    last_activity_at
  )
  VALUES (
    NEW.creator_user_id,
    NEW.fan_user_id,
    1,
    10, -- Base XP per listen
    NEW.listened_at
  )
  ON CONFLICT (creator_user_id, fan_user_id)
  DO UPDATE SET
    total_listens = creator_fan_leaderboards.total_listens + 1,
    total_xp_earned = creator_fan_leaderboards.total_xp_earned + 10,
    last_activity_at = NEW.listened_at,
    updated_at = now();

  -- Update ranks for this creator's leaderboard
  WITH ranked_fans AS (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY total_xp_earned DESC, total_listens DESC) as new_rank
    FROM public.creator_fan_leaderboards
    WHERE creator_user_id = NEW.creator_user_id
  )
  UPDATE public.creator_fan_leaderboards
  SET rank_position = ranked_fans.new_rank
  FROM ranked_fans
  WHERE creator_fan_leaderboards.id = ranked_fans.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for leaderboard updates
CREATE TRIGGER trigger_update_leaderboard_on_listen
AFTER INSERT ON public.spotify_listens
FOR EACH ROW
EXECUTE FUNCTION public.update_leaderboard_on_listen();