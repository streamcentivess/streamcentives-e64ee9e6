-- 1) Create a safe public view for profiles
create or replace view public.public_profiles as
select 
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
from public.profiles;

-- 2) Drop the overly permissive SELECT policy on profiles table
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- 3) The restrictive policy "Users can view their own profile" already exists, which is good

-- 4) Grant access to the public view for non-sensitive profile data
GRANT SELECT ON public.public_profiles TO anon, authenticated;