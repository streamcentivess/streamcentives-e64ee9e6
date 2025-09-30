-- Update social interaction notification trigger to check preferences for likes, comments, shares, reposts
CREATE OR REPLACE FUNCTION public.create_social_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  actor_name TEXT;
  preferences_enabled BOOLEAN;
  preference_column TEXT;
BEGIN
  -- Get actor's display name
  SELECT COALESCE(display_name, username, 'Someone') INTO actor_name
  FROM public.profiles 
  WHERE user_id = NEW.user_id;

  -- Don't notify if it's the user's own content
  IF NEW.target_user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Don't notify if no target user
  IF NEW.target_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Determine which preference to check based on interaction type
  preference_column := CASE NEW.interaction_type
    WHEN 'like' THEN 'like_notifications'
    WHEN 'comment' THEN 'comment_notifications'
    WHEN 'repost' THEN 'repost_notifications'
    WHEN 'share' THEN 'share_notifications'
    ELSE 'like_notifications'
  END;

  -- Check if user has this type of notification enabled
  EXECUTE format('SELECT COALESCE(%I, true) FROM public.notification_preferences WHERE user_id = $1', preference_column)
  INTO preferences_enabled
  USING NEW.target_user_id;

  -- Default to true if no preference found
  preferences_enabled := COALESCE(preferences_enabled, true);

  IF preferences_enabled = false THEN
    RETURN NEW;
  END IF;

  -- Handle different interaction types
  CASE NEW.interaction_type
    WHEN 'like' THEN
      notification_title := 'New Like';
      notification_message := actor_name || ' liked your ' || NEW.content_type;
    WHEN 'comment' THEN
      notification_title := 'New Comment';
      notification_message := actor_name || ' commented on your ' || NEW.content_type;
    WHEN 'repost' THEN
      notification_title := 'Content Reposted';
      notification_message := actor_name || ' reposted your ' || NEW.content_type;
    WHEN 'share' THEN
      notification_title := 'Content Shared';
      notification_message := actor_name || ' shared your ' || NEW.content_type;
    ELSE
      notification_title := 'New Interaction';
      notification_message := actor_name || ' interacted with your content';
  END CASE;

  -- Create notification for content owner
  IF NEW.target_user_id IS NOT NULL AND NEW.target_user_id != NEW.user_id THEN
    INSERT INTO public.notifications (
      user_id, type, title, message, data, priority
    ) VALUES (
      NEW.target_user_id,
      'social_interaction',
      notification_title,
      notification_message,
      jsonb_build_object(
        'interaction_type', NEW.interaction_type,
        'content_type', NEW.content_type,
        'content_id', NEW.target_content_id,
        'actor_id', NEW.user_id,
        'actor_name', actor_name
      ),
      'normal'
    );
  END IF;

  RETURN NEW;
END;
$$;