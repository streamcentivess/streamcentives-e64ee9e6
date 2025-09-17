-- Create a secure RPC to search public profile fields across all users
-- Returns only safe columns and bypasses RLS via SECURITY DEFINER
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
  created_at timestamptz
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
    p.created_at
  FROM public.profiles p
  WHERE (
    search_query IS NULL 
    OR search_query = '' 
    OR p.username ILIKE '%' || search_query || '%'
    OR p.display_name ILIKE '%' || search_query || '%'
  )
  AND (auth.uid() IS NULL OR p.user_id <> auth.uid())
  ORDER BY p.display_name NULLS LAST, p.username NULLS LAST
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Ensure callers can execute the function
GRANT EXECUTE ON FUNCTION public.search_public_profiles(text, int, int) TO anon, authenticated;