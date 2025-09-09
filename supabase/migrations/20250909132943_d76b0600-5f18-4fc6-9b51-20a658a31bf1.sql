-- Fix RLS policies for public_profiles view to allow authenticated users to see other profiles
GRANT SELECT ON public_profiles TO authenticated;

-- Update sign up flow to skip email confirmation by removing emailRedirectTo requirement
-- This is handled in the client code, not database

-- Fix post count issue by ensuring posts query works correctly
-- Update posts RLS policy to ensure proper viewing permissions
DROP POLICY IF EXISTS "Posts are publicly viewable" ON public.posts;
CREATE POLICY "Posts are publicly viewable" ON public.posts
  FOR SELECT USING (true);

-- Ensure profiles can be viewed by others (not just own profile)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view profiles" ON public.profiles
  FOR SELECT USING (true);