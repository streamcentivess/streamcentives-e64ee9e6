-- CRITICAL SECURITY FIX: Stop unauthorized access to sensitive profile data
-- Current issue: ANY authenticated user can see other users' emails, locations, ages, interests

-- Step 1: Remove the dangerous policy that exposes sensitive data
DROP POLICY IF EXISTS "Authenticated users can view public profile data" ON public.profiles;

-- Step 2: Create a highly restrictive policy that blocks access to sensitive columns
-- This policy will prevent unauthorized access to email, age, location, interests
CREATE POLICY "Block sensitive profile data access" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (
  -- Only allow access to own profile for sensitive data
  -- OR restrict to safe columns only for others
  auth.uid() = user_id
);

-- Step 3: Update the existing safe functions to be the primary access method
-- These functions control exactly what data is exposed

-- Function for safe public profile access (no sensitive data)
CREATE OR REPLACE FUNCTION public.get_safe_profile(target_user_id uuid)
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
  -- EXCLUDES: email, age, location, interests, merch_store_url
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

-- Step 4: Grant safe access to the secure functions
GRANT EXECUTE ON FUNCTION public.get_safe_profile(uuid) TO public, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_profile_safe(uuid) TO public, authenticated;  
GRANT EXECUTE ON FUNCTION public.get_my_complete_profile() TO authenticated;

-- Step 5: Update safe_profiles_view to ensure it only shows safe data
DROP VIEW IF EXISTS public.safe_profiles_view;
CREATE VIEW public.safe_profiles_view AS
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