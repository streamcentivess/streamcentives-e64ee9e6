-- Add email column to profiles table for username-to-email lookup
ALTER TABLE public.profiles 
ADD COLUMN email TEXT;

-- Update the handle_new_user function to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url, email)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new.email
  );
  RETURN new;
END;
$function$;

-- Update existing profiles to include email (where possible)
UPDATE public.profiles 
SET email = (
  SELECT au.email 
  FROM auth.users au 
  WHERE au.id = profiles.user_id
) 
WHERE email IS NULL;