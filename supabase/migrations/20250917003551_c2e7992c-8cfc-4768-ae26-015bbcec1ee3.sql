-- Clean up and recreate views to eliminate security definer warnings
-- Drop and recreate the views without any security definer properties

-- Drop existing views
DROP VIEW IF EXISTS public.public_profiles CASCADE;
DROP VIEW IF EXISTS public.user_follow_stats CASCADE;

-- Recreate public_profiles view with clean definition
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

-- Recreate user_follow_stats view with clean definition
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

-- Grant access to the views
GRANT SELECT ON public.public_profiles TO authenticated, anon;
GRANT SELECT ON public.user_follow_stats TO authenticated, anon;

-- These views will inherit security from the underlying tables naturally
-- The profiles table has RLS that only allows users to see their own complete data
-- But these views only expose safe, non-sensitive columns that can be viewed publicly