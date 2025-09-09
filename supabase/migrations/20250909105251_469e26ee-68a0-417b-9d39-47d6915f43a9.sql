-- Fix security warnings by setting proper search_path for functions
CREATE OR REPLACE FUNCTION public.ensure_unique_username()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
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