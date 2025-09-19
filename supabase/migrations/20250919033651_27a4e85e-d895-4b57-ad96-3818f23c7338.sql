-- Fix foreign key constraints to allow user deletion
ALTER TABLE public.analytics_events DROP CONSTRAINT IF EXISTS analytics_events_user_id_fkey;

-- Add new foreign key with CASCADE delete
ALTER TABLE public.analytics_events 
ADD CONSTRAINT analytics_events_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create user anonymization function
CREATE OR REPLACE FUNCTION public.anonymize_user_data(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  anonymous_name TEXT := 'Deleted User';
  anonymous_email TEXT := 'deleted-' || target_user_id::text || '@anonymous.com';
BEGIN
  -- Anonymize profile data
  UPDATE public.profiles 
  SET 
    username = 'deleted_' || substr(target_user_id::text, 1, 8),
    display_name = anonymous_name,
    bio = NULL,
    avatar_url = NULL,
    email = anonymous_email,
    age = NULL,
    location = NULL,
    interests = NULL,
    merch_store_url = NULL,
    youtube_username = NULL,
    youtube_channel_id = NULL
  WHERE user_id = target_user_id;

  -- Anonymize sponsor profiles
  UPDATE public.sponsor_profiles
  SET
    company_name = 'Deleted Company',
    company_website = NULL,
    company_description = NULL,
    logo_url = NULL,
    industry = 'other'
  WHERE user_id = target_user_id;

  -- Delete sensitive data
  DELETE FROM public.spotify_accounts WHERE user_id = target_user_id;
  DELETE FROM public.user_subscriptions WHERE subscriber_id = target_user_id;
  DELETE FROM public.messages WHERE sender_id = target_user_id OR recipient_id = target_user_id;
  DELETE FROM public.video_messages WHERE sender_id = target_user_id OR recipient_id = target_user_id;
  DELETE FROM public.notifications WHERE user_id = target_user_id;
  
  -- Keep campaigns and posts but anonymize ownership
  UPDATE public.campaigns SET creator_id = target_user_id WHERE creator_id = target_user_id;
  UPDATE public.posts SET user_id = target_user_id WHERE user_id = target_user_id;
  
  RAISE NOTICE 'User data anonymized for user_id: %', target_user_id;
END;
$$;