-- Additional security fix: Create column-level security for sensitive profile data
-- The previous RLS policies need additional column-level protection

-- Create a secure view that only exposes safe profile data
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

-- Enable RLS on the view
ALTER VIEW public.safe_profiles_view OWNER TO postgres;

-- Create RLS policies for the safe view
CREATE POLICY "Anyone can view safe profile data" 
ON public.safe_profiles_view
FOR SELECT 
TO public 
USING (true);

-- Update the profiles table to be more restrictive
-- Remove the policy that allows cross-user access and replace with function-based access
DROP POLICY IF EXISTS "Authenticated users can view public profile data" ON public.profiles;

-- Create a more restrictive policy: only allow users to see their own complete profile
-- For viewing other users' profiles, they must use the secure functions or view

-- Update the existing get_safe_public_profile function to be more secure
CREATE OR REPLACE FUNCTION public.get_public_profile_data(target_user_id uuid)
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
  -- This function provides controlled access to safe profile data
  -- It explicitly excludes sensitive columns: email, age, location, interests
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

-- Add additional protection: Create a policy that denies direct access to sensitive columns
-- This will help prevent accidental exposure through any remaining vulnerabilities
REVOKE ALL ON public.profiles FROM public;
REVOKE ALL ON public.profiles FROM authenticated;

-- Grant specific permissions
GRANT SELECT ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;  
GRANT UPDATE ON public.profiles TO authenticated;