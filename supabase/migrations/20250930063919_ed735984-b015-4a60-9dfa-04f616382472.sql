-- =====================================================
-- Phase 5: Notification Preferences
-- =====================================================

-- Add granular notification preference columns
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS follow_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS message_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS like_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS comment_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS share_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS repost_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS tag_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS milestone_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS engagement_milestone_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS campaign_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reward_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS profile_view_notifications BOOLEAN DEFAULT false;

-- Create function to get user preferences (cached for performance)
CREATE OR REPLACE FUNCTION public.get_notification_preference(
  target_user_id UUID,
  preference_type TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_enabled BOOLEAN;
BEGIN
  -- Get preference value
  EXECUTE format('SELECT COALESCE(%I, true) FROM notification_preferences WHERE user_id = $1', preference_type)
  INTO is_enabled
  USING target_user_id;
  
  -- Default to true if no preference record exists
  RETURN COALESCE(is_enabled, true);
END;
$$;

-- Update follow notification trigger to check preferences
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
  preferences_enabled BOOLEAN;
BEGIN
  -- Don't notify if following yourself
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;
  
  -- Check if user has follow notifications enabled
  SELECT COALESCE(follow_notifications, true)
  INTO preferences_enabled
  FROM public.notification_preferences
  WHERE user_id = NEW.following_id;
  
  IF preferences_enabled = false THEN
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
  
  -- Create notification
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

-- Update message notification trigger to check preferences
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
  preferences_enabled BOOLEAN;
BEGIN
  -- Don't notify if sender = recipient
  IF NEW.sender_id = NEW.recipient_id THEN
    RETURN NEW;
  END IF;
  
  -- Check if user has message notifications enabled
  SELECT COALESCE(message_notifications, true)
  INTO preferences_enabled
  FROM public.notification_preferences
  WHERE user_id = NEW.recipient_id;
  
  IF preferences_enabled = false THEN
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
  
  -- Create notification
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

-- Update tag mention notification to check preferences
CREATE OR REPLACE FUNCTION public.create_tag_mention_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tagger_name TEXT;
  tagger_username TEXT;
  post_preview TEXT;
  preferences_enabled BOOLEAN;
BEGIN
  -- Don't notify if tagging yourself
  IF NEW.tagged_user_id = NEW.tagged_by_user_id THEN
    RETURN NEW;
  END IF;
  
  -- Check if user has tag notifications enabled
  SELECT COALESCE(tag_notifications, true)
  INTO preferences_enabled
  FROM public.notification_preferences
  WHERE user_id = NEW.tagged_user_id;
  
  IF preferences_enabled = false THEN
    RETURN NEW;
  END IF;
  
  -- Get tagger's profile info
  SELECT 
    COALESCE(display_name, username, 'Someone'),
    username
  INTO tagger_name, tagger_username
  FROM public.profiles 
  WHERE user_id = NEW.tagged_by_user_id;
  
  -- Get post content preview
  SELECT LEFT(COALESCE(content, 'a post'), 50)
  INTO post_preview
  FROM public.posts
  WHERE id = NEW.post_id;
  
  -- Create notification
  INSERT INTO public.notifications (
    user_id, type, title, message,
    data, priority, action_url
  ) VALUES (
    NEW.tagged_user_id,
    'social_interaction',
    '🏷️ You were tagged',
    tagger_name || ' tagged you in ' || post_preview,
    jsonb_build_object(
      'interaction_type', 'tag',
      'actor_id', NEW.tagged_by_user_id,
      'actor_name', tagger_name,
      'post_id', NEW.post_id,
      'tag_type', NEW.tag_type
    ),
    'high',
    '/feed'
  );
  
  RETURN NEW;
END;
$$;

-- Update milestone notifications to check preferences
CREATE OR REPLACE FUNCTION public.check_follower_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_count INTEGER;
  milestone_reached INTEGER;
  preferences_enabled BOOLEAN;
BEGIN
  -- Don't check if following yourself
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;
  
  -- Check if user has milestone notifications enabled
  SELECT COALESCE(milestone_notifications, true)
  INTO preferences_enabled
  FROM public.notification_preferences
  WHERE user_id = NEW.following_id;
  
  IF preferences_enabled = false THEN
    RETURN NEW;
  END IF;
  
  -- Get current follower count
  SELECT COUNT(*)
  INTO follower_count
  FROM public.follows
  WHERE following_id = NEW.following_id;
  
  -- Check milestones
  milestone_reached := CASE
    WHEN follower_count = 1 THEN 1
    WHEN follower_count = 10 THEN 10
    WHEN follower_count = 50 THEN 50
    WHEN follower_count = 100 THEN 100
    WHEN follower_count = 500 THEN 500
    WHEN follower_count = 1000 THEN 1000
    WHEN follower_count = 5000 THEN 5000
    WHEN follower_count = 10000 THEN 10000
    ELSE 0
  END;
  
  -- Create milestone notification
  IF milestone_reached > 0 THEN
    INSERT INTO public.notifications (
      user_id, type, title, message,
      data, priority
    ) VALUES (
      NEW.following_id,
      'milestone',
      '🎉 Follower Milestone Reached!',
      'Congratulations! You now have ' || milestone_reached || ' followers!',
      jsonb_build_object(
        'milestone_type', 'followers',
        'milestone_value', milestone_reached,
        'current_count', follower_count
      ),
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update engagement milestone to check preferences
CREATE OR REPLACE FUNCTION public.check_engagement_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  interaction_count INTEGER;
  post_owner_id UUID;
  milestone_reached INTEGER;
  milestones INTEGER[] := ARRAY[10, 50, 100, 500, 1000];
  milestone INTEGER;
  preferences_enabled BOOLEAN;
BEGIN
  -- Don't notify for self-interactions
  IF NEW.user_id = NEW.target_user_id THEN
    RETURN NEW;
  END IF;
  
  -- Only check for likes and shares
  IF NEW.interaction_type NOT IN ('like', 'share') THEN
    RETURN NEW;
  END IF;
  
  post_owner_id := NEW.target_user_id;
  
  IF post_owner_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if user has engagement milestone notifications enabled
  SELECT COALESCE(engagement_milestone_notifications, true)
  INTO preferences_enabled
  FROM public.notification_preferences
  WHERE user_id = post_owner_id;
  
  IF preferences_enabled = false THEN
    RETURN NEW;
  END IF;
  
  -- Count interactions
  SELECT COUNT(*)
  INTO interaction_count
  FROM public.social_interactions
  WHERE target_content_id = NEW.target_content_id
    AND interaction_type = NEW.interaction_type;
  
  -- Check milestones
  FOREACH milestone IN ARRAY milestones
  LOOP
    IF interaction_count = milestone THEN
      INSERT INTO public.notifications (
        user_id, type, title, message,
        data, priority, action_url
      ) VALUES (
        post_owner_id,
        'engagement_milestone',
        '📈 Your content is trending!',
        'Your post reached ' || milestone || ' ' || NEW.interaction_type || 's!',
        jsonb_build_object(
          'milestone_type', 'engagement_' || NEW.interaction_type,
          'milestone_value', milestone,
          'post_id', NEW.target_content_id,
          'interaction_type', NEW.interaction_type
        ),
        'normal',
        '/feed'
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Update campaign invite to check preferences
CREATE OR REPLACE FUNCTION public.create_campaign_invite_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign_name TEXT;
  inviter_name TEXT;
  preferences_enabled BOOLEAN;
BEGIN
  -- Check if user has campaign notifications enabled
  SELECT COALESCE(campaign_notifications, true)
  INTO preferences_enabled
  FROM public.notification_preferences
  WHERE user_id = NEW.user_id;
  
  IF preferences_enabled = false THEN
    RETURN NEW;
  END IF;
  
  -- Get campaign name
  SELECT title
  INTO campaign_name
  FROM public.campaigns
  WHERE id = NEW.campaign_id;
  
  -- Get inviter name
  SELECT COALESCE(p.display_name, p.username, 'Someone')
  INTO inviter_name
  FROM public.campaigns c
  JOIN public.profiles p ON p.user_id = c.creator_id
  WHERE c.id = NEW.campaign_id;
  
  -- Create notification
  INSERT INTO public.notifications (
    user_id, type, title, message,
    data, priority, action_url
  ) VALUES (
    NEW.user_id,
    'campaign_invite',
    '🎯 Campaign Invitation',
    inviter_name || ' invited you to join "' || campaign_name || '"',
    jsonb_build_object(
      'campaign_id', NEW.campaign_id,
      'campaign_name', campaign_name,
      'inviter_name', inviter_name,
      'role', NEW.role
    ),
    'high',
    '/campaigns'
  );
  
  RETURN NEW;
END;
$$;

-- Update shoutout notification to check preferences
CREATE OR REPLACE FUNCTION public.create_shoutout_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_name TEXT;
  creator_username TEXT;
  preferences_enabled BOOLEAN;
BEGIN
  -- Only notify when shoutout is sent
  IF NEW.is_sent = false THEN
    RETURN NEW;
  END IF;
  
  -- Don't notify if already notified
  IF OLD.is_sent = true THEN
    RETURN NEW;
  END IF;
  
  -- Check if user has reward notifications enabled
  SELECT COALESCE(reward_notifications, true)
  INTO preferences_enabled
  FROM public.notification_preferences
  WHERE user_id = NEW.fan_id;
  
  IF preferences_enabled = false THEN
    RETURN NEW;
  END IF;
  
  -- Get creator info
  SELECT 
    COALESCE(display_name, username, 'Someone'),
    username
  INTO creator_name, creator_username
  FROM public.profiles
  WHERE user_id = NEW.creator_id;
  
  -- Create notification
  INSERT INTO public.notifications (
    user_id, type, title, message,
    data, priority, action_url
  ) VALUES (
    NEW.fan_id,
    'reward_received',
    '🎁 You received a shoutout!',
    creator_name || ' sent you a personalized shoutout!',
    jsonb_build_object(
      'shoutout_id', NEW.id,
      'creator_id', NEW.creator_id,
      'creator_name', creator_name,
      'achievement_text', NEW.achievement_text
    ),
    'high',
    '/' || COALESCE(creator_username, NEW.creator_id::text)
  );
  
  RETURN NEW;
END;
$$;