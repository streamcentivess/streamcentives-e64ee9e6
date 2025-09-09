-- Fix security definer views by recreating them without SECURITY DEFINER
-- Drop and recreate the views with proper SECURITY INVOKER property

-- Drop the existing views
DROP VIEW IF EXISTS public.user_follow_stats;
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate public_profiles view with SECURITY INVOKER (default)
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS 
SELECT 
    user_id,
    username,
    display_name,
    avatar_url,
    country_code,
    country_name,
    spotify_connected,
    merch_store_connected,
    merch_store_url,
    created_at
FROM profiles;

-- Recreate user_follow_stats view with SECURITY INVOKER (default)
CREATE VIEW public.user_follow_stats 
WITH (security_invoker = true)
AS 
SELECT 
    p.user_id,
    COALESCE(followers.count, 0::bigint) AS followers_count,
    COALESCE(following.count, 0::bigint) AS following_count
FROM profiles p
LEFT JOIN (
    SELECT 
        follows.following_id AS user_id,
        count(*) AS count
    FROM follows
    GROUP BY follows.following_id
) followers ON (p.user_id = followers.user_id)
LEFT JOIN (
    SELECT 
        follows.follower_id AS user_id,
        count(*) AS count
    FROM follows
    GROUP BY follows.follower_id
) following ON (p.user_id = following.user_id);

-- Set proper permissions on the views
-- Only authenticated users can access these views
REVOKE ALL ON public.public_profiles FROM PUBLIC;
REVOKE ALL ON public.user_follow_stats FROM PUBLIC;

GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.user_follow_stats TO authenticated;