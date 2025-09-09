-- Ensure the handle_new_user function creates profiles with all search fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id, 
    display_name, 
    avatar_url, 
    email,
    username,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.email,
    -- Generate a unique username from email if not provided
    LOWER(REGEXP_REPLACE(split_part(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g')),
    NOW()
  );
  RETURN NEW;
END;
$function$;

-- Create index on search fields for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_search ON public.profiles 
USING gin(to_tsvector('english', COALESCE(username, '') || ' ' || COALESCE(display_name, '') || ' ' || COALESCE(email, '')));

-- Create a unique constraint on username to prevent duplicates
-- Handle conflicts by appending a number
CREATE OR REPLACE FUNCTION public.ensure_unique_username()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  base_username TEXT;
  counter INTEGER := 1;
  new_username TEXT;
BEGIN
  base_username := NEW.username;
  new_username := base_username;
  
  -- Check if username already exists and append number if needed
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = new_username AND user_id != NEW.user_id) LOOP
    new_username := base_username || counter;
    counter := counter + 1;
  END LOOP;
  
  NEW.username := new_username;
  RETURN NEW;
END;
$function$;

-- Create trigger to ensure unique usernames
DROP TRIGGER IF EXISTS ensure_unique_username_trigger ON public.profiles;
CREATE TRIGGER ensure_unique_username_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (NEW.username IS NOT NULL)
  EXECUTE FUNCTION public.ensure_unique_username();