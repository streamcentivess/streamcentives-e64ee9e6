-- Create follows table to track user relationships
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable Row Level Security
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can follow others"
ON public.follows
FOR INSERT
WITH CHECK (auth.uid() = follower_id AND follower_id != following_id);

CREATE POLICY "Users can unfollow others"
ON public.follows
FOR DELETE
USING (auth.uid() = follower_id);

CREATE POLICY "Follow relationships are publicly viewable"
ON public.follows
FOR SELECT
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX idx_follows_following_id ON public.follows(following_id);

-- Create view for follower/following counts
CREATE OR REPLACE VIEW public.user_follow_stats AS
SELECT 
  p.user_id,
  COALESCE(followers.count, 0) as followers_count,
  COALESCE(following.count, 0) as following_count
FROM public.profiles p
LEFT JOIN (
  SELECT following_id as user_id, COUNT(*) as count
  FROM public.follows
  GROUP BY following_id
) followers ON p.user_id = followers.user_id
LEFT JOIN (
  SELECT follower_id as user_id, COUNT(*) as count
  FROM public.follows
  GROUP BY follower_id
) following ON p.user_id = following.user_id;