-- First, let's identify the founder's user_id for @kofa
-- Based on the current user data, this should be the kofa user

-- Create a function to automatically follow the founder when a new user signs up
CREATE OR REPLACE FUNCTION public.auto_follow_founder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  founder_user_id UUID;
BEGIN
  -- Get the founder's user_id (kofa)
  SELECT user_id INTO founder_user_id
  FROM public.profiles
  WHERE username = 'kofa'
  LIMIT 1;
  
  -- Only proceed if we found the founder and it's not the founder signing up
  IF founder_user_id IS NOT NULL AND NEW.user_id != founder_user_id THEN
    -- Create follow relationship
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (NEW.user_id, founder_user_id)
    ON CONFLICT (follower_id, following_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run the auto-follow function when a new profile is created
DROP TRIGGER IF EXISTS trigger_auto_follow_founder ON public.profiles;
CREATE TRIGGER trigger_auto_follow_founder
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_follow_founder();

-- Now make all existing users follow the founder (one-time operation)
-- First, get the founder's user_id
DO $$
DECLARE
  founder_user_id UUID;
  user_record RECORD;
BEGIN
  -- Get the founder's user_id
  SELECT user_id INTO founder_user_id
  FROM public.profiles
  WHERE username = 'kofa'
  LIMIT 1;
  
  -- Only proceed if we found the founder
  IF founder_user_id IS NOT NULL THEN
    -- Insert follow relationships for all existing users who aren't already following
    INSERT INTO public.follows (follower_id, following_id)
    SELECT 
      p.user_id,
      founder_user_id
    FROM public.profiles p
    WHERE p.user_id != founder_user_id -- Don't make founder follow themselves
      AND NOT EXISTS (
        SELECT 1 
        FROM public.follows f 
        WHERE f.follower_id = p.user_id 
          AND f.following_id = founder_user_id
      )
    ON CONFLICT (follower_id, following_id) DO NOTHING;
    
    RAISE NOTICE 'Auto-follow setup completed for founder user_id: %', founder_user_id;
  ELSE
    RAISE NOTICE 'Founder user @kofa not found';
  END IF;
END;
$$;