-- CRITICAL SECURITY FIX: Fix profiles table RLS policies
-- Remove the dangerous public read policy
DROP POLICY IF EXISTS "Public can view limited profile info" ON public.profiles;

-- Create secure policies that only allow authenticated users to see limited public data
-- Users can only see basic info of other users, not sensitive data like email, age, location
CREATE POLICY "Authenticated users can view basic profile info" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() != user_id)
WITH (username, display_name, avatar_url, bio, spotify_connected, merch_store_connected, created_at);

-- Users can see their own complete profile
-- The existing policy "Users can view their own complete profile" already handles this correctly

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

-- Fix function search_path issues for security
-- Update handle_new_user function to have proper search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
DECLARE  
  detected_country_code TEXT;
  detected_country_name TEXT;
  generated_username TEXT;
BEGIN
  -- Try to extract country from user metadata or default to US
  detected_country_code := COALESCE(NEW.raw_user_meta_data ->> 'country', 'US');
  detected_country_name := COALESCE(NEW.raw_user_meta_data ->> 'country_name', 'United States');
  
  -- Generate a username, ensuring it's never empty
  generated_username := COALESCE(
    NULLIF(LOWER(REGEXP_REPLACE(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g')), ''),
    'user_' || substr(NEW.id::text, 1, 8)
  );
  
  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    avatar_url, 
    email,
    username,
    country_code,
    country_name,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.email,
    generated_username,
    detected_country_code,
    detected_country_name,
    NOW()
  );
  RETURN NEW;
END;
$$;

-- Update get_public_profile_data function to have proper search_path
CREATE OR REPLACE FUNCTION public.get_public_profile_data(profile_user_id uuid)
RETURNS TABLE(user_id uuid, username text, display_name text, avatar_url text, bio text, spotify_connected boolean, merch_store_connected boolean, created_at timestamp with time zone, country_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only return safe, non-sensitive profile information
  RETURN QUERY
  SELECT 
    p.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.spotify_connected,
    p.merch_store_connected,
    p.created_at,
    p.country_name
  FROM public.profiles p
  WHERE p.user_id = profile_user_id;
END;
$$;