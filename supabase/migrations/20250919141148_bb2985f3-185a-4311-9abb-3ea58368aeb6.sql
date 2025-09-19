-- Add location column to community_posts table
ALTER TABLE public.community_posts 
ADD COLUMN IF NOT EXISTS location TEXT DEFAULT NULL;