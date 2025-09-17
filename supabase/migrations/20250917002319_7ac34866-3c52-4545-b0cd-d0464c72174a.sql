-- Restore endpoints used by the app while keeping security intact

-- 1) Recreate user_follow_stats view (no sensitive data, based only on follows)
CREATE OR REPLACE VIEW public.user_follow_stats AS
WITH all_ids AS (
  SELECT follower_id AS user_id FROM public.follows
  UNION
  SELECT following_id AS user_id FROM public.follows
)
SELECT 
  id.user_id,
  (SELECT COUNT(*) FROM public.follows f WHERE f.follower_id = id.user_id) AS following_count,
  (SELECT COUNT(*) FROM public.follows f WHERE f.following_id = id.user_id) AS followers_count
FROM all_ids id;

-- 2) Recreate public_profiles view (safe fields only)
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  p.user_id,
  p.username,
  p.display_name,
  p.avatar_url
FROM public.profiles p;