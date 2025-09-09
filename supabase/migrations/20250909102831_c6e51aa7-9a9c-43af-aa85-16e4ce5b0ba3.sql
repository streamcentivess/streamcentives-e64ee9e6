-- Add missing profile fields for comprehensive user profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS interests TEXT;

-- Add indexes for better performance on commonly queried fields
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);