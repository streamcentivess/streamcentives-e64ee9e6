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