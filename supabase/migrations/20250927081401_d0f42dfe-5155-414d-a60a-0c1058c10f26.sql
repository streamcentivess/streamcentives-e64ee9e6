-- Update search_public_profiles function to include creator_type and follower count for verification badges
DROP FUNCTION IF EXISTS public.search_public_profiles(text, integer, integer);

CREATE OR REPLACE FUNCTION public.search_public_profiles(
  search_query text,
  limit_count int DEFAULT 20,
  offset_count int DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  country_name text,
  spotify_connected boolean,
  merch_store_connected boolean,
  creator_type text,
  created_at timestamptz,
  follower_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    COALESCE(p.bio, '') as bio,
    COALESCE(p.country_name, '') as country_name,
    COALESCE(p.spotify_connected, false) as spotify_connected,
    COALESCE(p.merch_store_connected, false) as merch_store_connected,
    p.creator_type::text,
    p.created_at,
    COALESCE(fc.follower_count, 0) as follower_count
  FROM public.profiles p
  LEFT JOIN (
    SELECT following_id, COUNT(*) as follower_count
    FROM public.follows
    GROUP BY following_id
  ) fc ON fc.following_id = p.user_id
  WHERE (
    search_query IS NULL 
    OR search_query = '' 
    OR p.username ILIKE '%' || search_query || '%'
    OR p.display_name ILIKE '%' || search_query || '%'
    OR p.bio ILIKE '%' || search_query || '%'
  )
  AND p.username IS NOT NULL
  AND p.display_name IS NOT NULL
  ORDER BY 
    CASE 
      WHEN p.username ILIKE search_query || '%' THEN 1
      WHEN p.display_name ILIKE search_query || '%' THEN 2
      ELSE 3
    END,
    fc.follower_count DESC NULLS LAST,
    p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Ensure callers can execute the function
GRANT EXECUTE ON FUNCTION public.search_public_profiles(text, int, int) TO anon, authenticated;