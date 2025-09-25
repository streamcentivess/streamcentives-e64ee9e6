-- Create or replace the function to get creators by category
CREATE OR REPLACE FUNCTION public.get_creators_by_category(
    category_filter text DEFAULT NULL,
    fan_user_id uuid DEFAULT NULL,
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
    follower_count bigint,
    content_count integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
        COALESCE(fc.follower_count, 0) as follower_count,
        COALESCE(cc.content_count, 0) as content_count
    FROM public.profiles p
    LEFT JOIN (
        SELECT following_id, COUNT(*) as follower_count
        FROM public.follows
        GROUP BY following_id
    ) fc ON fc.following_id = p.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(*) as content_count
        FROM public.posts
        GROUP BY user_id
    ) cc ON cc.user_id = p.user_id
    WHERE 
        p.creator_type IS NOT NULL
        AND (category_filter IS NULL OR p.creator_type::text = category_filter)
        AND (fan_user_id IS NULL OR p.user_id != fan_user_id)
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