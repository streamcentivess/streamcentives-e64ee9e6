-- Add cover_photo_url column to rewards table
ALTER TABLE public.rewards 
ADD COLUMN cover_photo_url TEXT;