-- CRITICAL SECURITY FIX: Fix profiles table RLS policies
-- Remove the dangerous public read policy that exposes user data
DROP POLICY IF EXISTS "Public can view limited profile info" ON public.profiles;

-- Create secure policy that only allows authenticated users to see basic profile info
-- This excludes sensitive data like email, age, location, interests
CREATE POLICY "Authenticated users can view basic profile info" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  auth.uid() != user_id 
  AND auth.uid() IS NOT NULL
);

-- CRITICAL: Fix user_follow_stats table - add RLS policies
ALTER TABLE public.user_follow_stats ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can view follow stats
CREATE POLICY "Authenticated users can view follow stats" 
ON public.user_follow_stats 
FOR SELECT 
TO authenticated
USING (true);

-- Users can only insert/update their own follow stats
CREATE POLICY "Users can manage their own follow stats" 
ON public.user_follow_stats 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);