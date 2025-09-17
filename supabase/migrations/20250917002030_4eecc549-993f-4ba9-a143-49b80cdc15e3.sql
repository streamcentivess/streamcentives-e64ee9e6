-- Drop existing functions and recreate with correct signatures

-- Drop the existing functions that have conflicts
DROP FUNCTION IF EXISTS public.get_public_profile_safe(uuid);
DROP FUNCTION IF EXISTS public.get_safe_public_profile(uuid);

-- Create the secure view for safe profile data
CREATE OR REPLACE VIEW public.safe_profiles_view AS
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
FROM profiles;

-- Function 1: Get safe public profile data (no sensitive info)
CREATE OR REPLACE FUNCTION public.get_public_profile_safe(target_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  country_name text,
  created_at timestamp with time zone,
  spotify_connected boolean,
  merch_store_connected boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Return only safe, non-sensitive profile information
  -- Excludes: email, age, location, interests, merch_store_url
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
    p.merch_store_connected
  FROM profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Function 2: Get complete profile (only for the profile owner)
CREATE OR REPLACE FUNCTION public.get_my_complete_profile()
RETURNS TABLE(
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  email text,
  age text,
  location text,
  interests text,
  country_code text,
  country_name text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  spotify_connected boolean,
  merch_store_connected boolean,
  merch_store_url text,
  merch_store_platform text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Return complete profile data only for the authenticated user
  RETURN QUERY
  SELECT 
    p.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.email,
    p.age,
    p.location,
    p.interests,
    p.country_code,
    p.country_name,
    p.created_at,
    p.updated_at,
    p.spotify_connected,
    p.merch_store_connected,
    p.merch_store_url,
    p.merch_store_platform
  FROM profiles p
  WHERE p.user_id = auth.uid();
END;
$$;

-- Grant appropriate permissions
GRANT SELECT ON public.safe_profiles_view TO public, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile_safe(uuid) TO public, authenticated;  
GRANT EXECUTE ON FUNCTION public.get_my_complete_profile() TO authenticated;