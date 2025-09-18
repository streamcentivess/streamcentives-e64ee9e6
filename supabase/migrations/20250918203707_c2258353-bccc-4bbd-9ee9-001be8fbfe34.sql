-- Add profile completion tracking column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Update the handle_new_user function to not auto-populate display_name
-- This ensures OAuth users are treated as new users needing onboarding
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
    avatar_url, 
    email,
    username,
    country_code,
    country_name,
    onboarding_completed,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.email,
    generated_username,
    detected_country_code,
    detected_country_name,
    false, -- Always set to false for new users
    NOW()
  );
  RETURN NEW;
END;
$$;