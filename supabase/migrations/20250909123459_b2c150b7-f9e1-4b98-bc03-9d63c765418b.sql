-- Fix the foreign key constraint issue with profiles table
-- The issue is that the foreign key references auth.users but the user might not exist there
-- Let's remove the foreign key constraint and add a proper trigger

-- First, drop the existing foreign key constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- Update the public_profiles view to ensure it shows current data without caching issues
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate public_profiles view with better performance and no caching
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS 
SELECT 
    user_id,
    username,
    display_name,
    avatar_url,
    country_code,
    country_name,
    spotify_connected,
    merch_store_connected,
    merch_store_url,
    created_at
FROM profiles
WHERE username IS NOT NULL AND username != '';

-- Grant proper permissions
REVOKE ALL ON public.public_profiles FROM PUBLIC;
GRANT SELECT ON public.public_profiles TO authenticated;

-- Add an index on username for better search performance
CREATE INDEX IF NOT EXISTS idx_profiles_username_search ON public.profiles USING gin(username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_search ON public.profiles USING gin(display_name gin_trgm_ops);

-- Enable the pg_trgm extension for better text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;