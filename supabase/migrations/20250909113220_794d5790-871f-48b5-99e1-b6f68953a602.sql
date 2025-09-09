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

-- 2) Ensure RLS is enabled on base table (already enabled per schema)
alter table public.profiles enable row level security;

-- 3) Replace overly permissive SELECT policy on profiles
-- Drop existing public SELECT policy if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'profiles' 
      AND policyname = 'Users can view all profiles'
  ) THEN
    EXECUTE 'DROP POLICY "Users can view all profiles" ON public.profiles';
  END IF;
END $$;

-- Add strict self-only SELECT policy
create policy "Users can view their own profile"
  on public.profiles
  for select
  using (auth.uid() = user_id);

-- Keep existing INSERT/UPDATE policies as-is

-- 4) Secure the view with RLS via a security definer function and policy on the view
-- Note: Views do not support RLS directly; we use grants.
-- Strategy: Revoke default privileges then grant SELECT on view to anon/authenticated.
-- This exposes only the non-sensitive columns in the view.

revoke all on public.public_profiles from anon, authenticated;
grant select on public.public_profiles to anon, authenticated;