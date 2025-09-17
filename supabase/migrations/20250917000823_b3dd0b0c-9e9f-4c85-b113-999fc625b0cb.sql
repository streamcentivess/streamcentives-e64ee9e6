-- Fix critical security vulnerability in update_updated_at_column function
-- This function is used by 54+ triggers across the database

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = ''
AS $function$
BEGIN
  -- Use schema-qualified built-ins to avoid search_path poisoning
  -- Set updated_at to current UTC timestamp
  NEW.updated_at = pg_catalog.timezone('UTC'::text, pg_catalog.now());
  RETURN NEW;
END;
$function$;