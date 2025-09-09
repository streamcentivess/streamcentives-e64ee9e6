-- Ensure the trigger for creating profiles on user signup exists and works properly
-- This is crucial for new users to be immediately searchable

-- First, check if the trigger exists and recreate it if needed
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger to ensure new users get profiles immediately
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also ensure the unique username trigger exists for the profiles table
DROP TRIGGER IF EXISTS ensure_unique_username_trigger ON public.profiles;

CREATE TRIGGER ensure_unique_username_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.ensure_unique_username();

-- Add a small optimization to refresh the public_profiles view immediately
-- by ensuring it's materialized correctly (though it should be automatically updated)
-- Let's also make sure we have proper indexing for instant search results

-- Refresh any materialized views if they exist (this is just for safety)
-- Note: public_profiles is a regular view, not materialized, so it should update immediately

-- Verify that new profiles will have proper usernames by ensuring the function handles edge cases
-- Update the handle_new_user function to be more robust with username generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public', 'auth'
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