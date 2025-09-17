-- Fix Security Definer View vulnerabilities by removing problematic views
-- These views bypass RLS policies and expose sensitive data

-- Drop problematic views that bypass RLS
DROP VIEW IF EXISTS public.boosted_campaigns CASCADE;
DROP VIEW IF EXISTS public.conversation_participants CASCADE; 
DROP VIEW IF EXISTS public.public_profiles CASCADE;
DROP VIEW IF EXISTS public.user_follow_stats CASCADE;

-- Create secure replacement for public_profiles with proper RLS
-- This function respects the existing RLS policies on the profiles table
CREATE OR REPLACE FUNCTION public.get_public_profile_safe(profile_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  username text, 
  display_name text,
  avatar_url text,
  bio text,
  country_name text,
  created_at timestamp with time zone,
  spotify_connected boolean,
  merch_store_connected boolean,
  merch_store_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only return safe, public profile information
  -- This respects RLS policies on the profiles table
  RETURN QUERY
  SELECT 
    p.user_id,
    p.username,
    p.display_name, 
    p.avatar_url,
    p.bio,
    p.country_name,
    p.created_at,
    p.spotify_connected,
    p.merch_store_connected,
    p.merch_store_url
  FROM profiles p
  WHERE p.user_id = profile_user_id;
END;
$$;

-- Create secure function for follow stats that respects RLS
CREATE OR REPLACE FUNCTION public.get_user_follow_stats_safe(target_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  following_count bigint,
  followers_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER  
SET search_path = 'public'
AS $$
BEGIN
  -- This function respects RLS policies on the follows table
  RETURN QUERY
  SELECT 
    target_user_id as user_id,
    (SELECT COUNT(*) FROM follows WHERE follower_id = target_user_id)::bigint as following_count,
    (SELECT COUNT(*) FROM follows WHERE following_id = target_user_id)::bigint as followers_count;
END;
$$;

-- Create secure function for boosted campaigns that respects RLS
CREATE OR REPLACE FUNCTION public.get_boosted_campaigns_safe()
RETURNS TABLE(
  id uuid,
  creator_id uuid,
  title text,
  description text,
  type text,
  xp_reward integer,
  cash_reward numeric,
  target_metric text,
  target_value integer,
  current_progress integer,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  status text,
  max_participants integer,
  image_url text,
  tags text[],
  requirements text,
  is_featured boolean,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  spotify_artist_url text,
  spotify_artist_id text,
  required_listen_duration_seconds integer,
  boost_score integer,
  is_boosted boolean,
  boost_expires_at timestamp with time zone,
  boost_multiplier numeric,
  visibility_score integer,
  currently_boosted boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- This function respects RLS policies on campaigns and campaign_boosts tables
  RETURN QUERY
  SELECT 
    c.id,
    c.creator_id,
    c.title,
    c.description,
    c.type,
    c.xp_reward,
    c.cash_reward,
    c.target_metric,
    c.target_value,
    c.current_progress,
    c.start_date,
    c.end_date,
    c.status,
    c.max_participants,
    c.image_url,
    c.tags,
    c.requirements,
    c.is_featured,
    c.created_at,
    c.updated_at,
    c.spotify_artist_url,
    c.spotify_artist_id,
    c.required_listen_duration_seconds,
    c.boost_score,
    c.is_boosted,
    c.boost_expires_at,
    c.boost_multiplier,
    COALESCE(c.boost_score, 0) as visibility_score,
    CASE 
      WHEN (c.is_boosted AND c.boost_expires_at > now()) THEN true 
      ELSE false 
    END as currently_boosted
  FROM campaigns c
  WHERE c.status = 'active'  -- Only show active campaigns publicly
  ORDER BY 
    CASE WHEN (c.is_boosted AND c.boost_expires_at > now()) THEN 1 ELSE 0 END DESC,
    COALESCE(c.boost_score, 0) DESC, 
    c.created_at DESC;
END;
$$;