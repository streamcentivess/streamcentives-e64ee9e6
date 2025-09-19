-- Fix security issues from previous migration

-- Update the generate_verification_code function to have proper search_path
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS TEXT 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    code TEXT;
    is_unique BOOLEAN := false;
BEGIN
    WHILE NOT is_unique LOOP
        code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
        SELECT NOT EXISTS(
            SELECT 1 FROM public.experiences WHERE verification_code = code
        ) INTO is_unique;
    END LOOP;
    RETURN code;
END;
$$;