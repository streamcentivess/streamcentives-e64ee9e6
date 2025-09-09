-- Enable real-time updates for public_profiles view
ALTER PUBLICATION supabase_realtime ADD TABLE public_profiles;

-- Also enable real-time for the underlying profiles table to ensure the view updates
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;

-- Update the public_profiles view to include more searchable fields
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles AS
SELECT 
  user_id,
  username,
  display_name,
  avatar_url,
  bio,
  location,
  interests,
  age,
  country_code,
  country_name,
  spotify_connected,
  merch_store_connected,
  merch_store_url,
  created_at
FROM public.profiles
WHERE username IS NOT NULL AND display_name IS NOT NULL;

-- Enable RLS on the view (though it will be publicly readable)
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Grant read access to authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;