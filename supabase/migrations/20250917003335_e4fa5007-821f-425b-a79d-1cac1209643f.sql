-- Restore safe views for profile data that apps need after security fixes
-- These views only expose non-sensitive information

-- Create safe public profiles view that exposes only safe data
CREATE VIEW public.public_profiles AS
SELECT 
  user_id,
  username,
  display_name,
  avatar_url,
  bio,
  country_name,
  created_at,
  spotify_connected,
  merch_store_connected
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- Enable RLS on the view (inherits from underlying table)
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Also create user_follow_stats view for followers/following information
CREATE VIEW public.user_follow_stats AS
SELECT 
  p.user_id,
  COALESCE(following_count.count, 0) as following_count,
  COALESCE(followers_count.count, 0) as followers_count
FROM public.profiles p
LEFT JOIN (
  SELECT follower_id as user_id, COUNT(*) as count
  FROM public.follows
  GROUP BY follower_id
) following_count ON p.user_id = following_count.user_id
LEFT JOIN (
  SELECT following_id as user_id, COUNT(*) as count
  FROM public.follows
  GROUP BY following_id
) followers_count ON p.user_id = followers_count.user_id;

-- Grant access to the follow stats view
GRANT SELECT ON public.user_follow_stats TO authenticated, anon;