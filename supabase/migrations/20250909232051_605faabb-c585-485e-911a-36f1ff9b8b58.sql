-- Check and fix any security definer views by recreating them without security definer
-- First drop and recreate the public_profiles view if it exists
DROP VIEW IF EXISTS public.public_profiles;

-- Create public_profiles view without security definer (using security invoker by default)
CREATE VIEW public.public_profiles AS
SELECT 
  user_id,
  username,
  display_name,
  avatar_url,
  bio,
  age,
  location,
  interests,
  country_code,
  country_name,
  created_at,
  spotify_connected,
  merch_store_connected,
  merch_store_url
FROM public.profiles;

-- Check and fix user_follow_stats view if it exists
DROP VIEW IF EXISTS public.user_follow_stats;

-- Create user_follow_stats view without security definer
CREATE VIEW public.user_follow_stats AS
SELECT 
  f.follower_id as user_id,
  COUNT(DISTINCT f.following_id) as following_count,
  COUNT(DISTINCT f2.follower_id) as followers_count
FROM public.follows f
LEFT JOIN public.follows f2 ON f.follower_id = f2.following_id
GROUP BY f.follower_id;