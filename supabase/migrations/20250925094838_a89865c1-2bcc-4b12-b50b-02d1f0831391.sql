-- Drop and recreate function with correct return types
DROP FUNCTION IF EXISTS public.get_creators_by_category(text, uuid, integer);

CREATE OR REPLACE FUNCTION public.get_creators_by_category(
  category_filter text DEFAULT NULL::text, 
  fan_user_id_param uuid DEFAULT NULL::uuid, 
  limit_count integer DEFAULT 20
)
RETURNS TABLE(
  user_id uuid, 
  username text, 
  display_name text, 
  avatar_url text, 
  bio text, 
  creator_type text, 
  spotify_connected boolean, 
  follower_count integer, 
  content_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        p.user_id,
        p.username,
        p.display_name,
        p.avatar_url,
        p.bio,
        p.creator_type::text,
        p.spotify_connected,
        COALESCE(fc.follower_count, 0)::integer as follower_count,
        COALESCE(cc.content_count, 0)::integer as content_count
    FROM public.profiles p
    LEFT JOIN (
        SELECT following_id, COUNT(*)::integer as follower_count
        FROM public.follows
        GROUP BY following_id
    ) fc ON fc.following_id = p.user_id
    LEFT JOIN (
        SELECT posts.user_id as post_user_id, COUNT(*)::integer as content_count
        FROM public.posts
        GROUP BY posts.user_id
    ) cc ON cc.post_user_id = p.user_id
    WHERE 
        p.creator_type IS NOT NULL
        AND (category_filter IS NULL OR p.creator_type::text = category_filter)
        AND p.username IS NOT NULL
        AND p.display_name IS NOT NULL
    ORDER BY 
        CASE 
            WHEN p.spotify_connected THEN 1 
            ELSE 2 
        END,
        fc.follower_count DESC NULLS LAST,
        RANDOM()
    LIMIT limit_count;
END;
$function$