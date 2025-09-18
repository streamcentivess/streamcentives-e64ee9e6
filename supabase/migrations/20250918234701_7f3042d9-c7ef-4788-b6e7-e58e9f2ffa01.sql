-- Add new columns to sponsor_profiles table for enhanced onboarding
ALTER TABLE public.sponsor_profiles 
ADD COLUMN IF NOT EXISTS target_audience text,
ADD COLUMN IF NOT EXISTS partnership_goals jsonb DEFAULT '[]'::jsonb;