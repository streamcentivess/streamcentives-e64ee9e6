-- Add creator_type enum and column to profiles table
CREATE TYPE creator_type AS ENUM (
  'musician',
  'podcaster', 
  'video_creator',
  'comedian',
  'author',
  'artist',
  'dancer',
  'gamer',
  'fitness_trainer',
  'chef',
  'educator',
  'lifestyle_influencer',
  'tech_creator',
  'beauty_creator',
  'travel_creator',
  'other'
);

-- Add creator_type column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN creator_type creator_type DEFAULT NULL;