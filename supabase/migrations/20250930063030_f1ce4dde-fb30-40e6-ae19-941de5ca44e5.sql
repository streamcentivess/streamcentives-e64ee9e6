-- =====================================================
-- Phase 2: Message Notifications Trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name TEXT;
  notification_priority TEXT;
  notification_title TEXT;
BEGIN
  -- Don't create notification if sender = recipient (shouldn't happen but safety check)
  IF NEW.sender_id = NEW.recipient_id THEN
    RETURN NEW;
  END IF;
  
  -- Get sender's display name
  SELECT COALESCE(display_name, username, 'Someone') 
  INTO sender_name
  FROM public.profiles 
  WHERE user_id = NEW.sender_id;
  
  -- Determine priority and title based on XP cost
  IF NEW.xp_cost = 0 THEN
    notification_priority := 'normal';
    notification_title := '📨 New Message Request';
  ELSE
    notification_priority := 'high';
    notification_title := '💬 New Priority Message';
  END IF;
  
  -- Create notification for recipient
  INSERT INTO public.notifications (
    user_id, type, title, message, 
    data, priority, action_url
  ) VALUES (
    NEW.recipient_id,
    'new_message',
    notification_title,
    sender_name || ' sent you a message',
    jsonb_build_object(
      'message_id', NEW.id,
      'sender_id', NEW.sender_id,
      'sender_name', sender_name,
      'xp_cost', NEW.xp_cost,
      'is_free', (NEW.xp_cost = 0)
    ),
    notification_priority,
    '/inbox'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS message_notification_trigger ON public.messages;
CREATE TRIGGER message_notification_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_message_notification();

-- =====================================================
-- Phase 3: Follow Notifications Trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_follow_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_name TEXT;
  follower_username TEXT;
  follower_avatar TEXT;
BEGIN
  -- Don't notify if following yourself (shouldn't happen but safety check)
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;
  
  -- Get follower's profile info
  SELECT 
    COALESCE(display_name, username, 'Someone'),
    username,
    avatar_url
  INTO follower_name, follower_username, follower_avatar
  FROM public.profiles 
  WHERE user_id = NEW.follower_id;
  
  -- Create notification for the followed user
  INSERT INTO public.notifications (
    user_id, type, title, message,
    data, priority, action_url
  ) VALUES (
    NEW.following_id,
    'social_interaction',
    '👥 New Follower',
    follower_name || ' started following you',
    jsonb_build_object(
      'interaction_type', 'follow',
      'actor_id', NEW.follower_id,
      'actor_name', follower_name,
      'actor_avatar', follower_avatar
    ),
    'high',
    '/' || COALESCE(follower_username, NEW.follower_id::text)
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on follows table
DROP TRIGGER IF EXISTS follow_notification_trigger ON public.follows;
CREATE TRIGGER follow_notification_trigger
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.create_follow_notification();