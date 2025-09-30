-- =====================================================
-- Phase 4: Instagram/TikTok-Style Notifications
-- =====================================================

-- =====================================================
-- 1. Tag Mention Notifications
-- =====================================================
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
BEGIN
  -- Don't notify if tagging yourself
  IF NEW.tagged_user_id = NEW.tagged_by_user_id THEN
    RETURN NEW;
  END IF;
  
  -- Get tagger's profile info
  SELECT 
    COALESCE(display_name, username, 'Someone'),
    username
  INTO tagger_name, tagger_username
  FROM public.profiles 
  WHERE user_id = NEW.tagged_by_user_id;
  
  -- Get post content preview (first 50 chars)
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

DROP TRIGGER IF EXISTS tag_mention_notification_trigger ON public.post_tags;
CREATE TRIGGER tag_mention_notification_trigger
  AFTER INSERT ON public.post_tags
  FOR EACH ROW
  EXECUTE FUNCTION public.create_tag_mention_notification();

-- =====================================================
-- 2. Follower Milestone Notifications
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_follower_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  follower_count INTEGER;
  milestone_reached INTEGER;
  followed_user_name TEXT;
BEGIN
  -- Don't check if following yourself
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;
  
  -- Get current follower count for the followed user
  SELECT COUNT(*)
  INTO follower_count
  FROM public.follows
  WHERE following_id = NEW.following_id;
  
  -- Get followed user's name
  SELECT COALESCE(display_name, username, 'You')
  INTO followed_user_name
  FROM public.profiles
  WHERE user_id = NEW.following_id;
  
  -- Check milestones: 1, 10, 50, 100, 500, 1000, 5000, 10000
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

DROP TRIGGER IF EXISTS follower_milestone_trigger ON public.follows;
CREATE TRIGGER follower_milestone_trigger
  AFTER INSERT ON public.follows
  FOR EACH ROW
  EXECUTE FUNCTION public.check_follower_milestones();

-- =====================================================
-- 3. XP Milestone Notifications
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_xp_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  old_xp INTEGER;
  new_xp INTEGER;
  milestone_reached INTEGER;
  milestones INTEGER[] := ARRAY[100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000];
  milestone INTEGER;
BEGIN
  old_xp := COALESCE(OLD.total_earned_xp, 0);
  new_xp := COALESCE(NEW.total_earned_xp, 0);
  
  -- Check each milestone
  FOREACH milestone IN ARRAY milestones
  LOOP
    -- If we crossed this milestone
    IF old_xp < milestone AND new_xp >= milestone THEN
      INSERT INTO public.notifications (
        user_id, type, title, message,
        data, priority
      ) VALUES (
        NEW.user_id,
        'milestone',
        '⭐ XP Milestone Reached!',
        'Amazing! You''ve earned ' || milestone || ' total XP!',
        jsonb_build_object(
          'milestone_type', 'xp',
          'milestone_value', milestone,
          'current_xp', new_xp
        ),
        'high'
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS xp_milestone_trigger ON public.user_xp_balances;
CREATE TRIGGER xp_milestone_trigger
  AFTER UPDATE ON public.user_xp_balances
  FOR EACH ROW
  WHEN (OLD.total_earned_xp IS DISTINCT FROM NEW.total_earned_xp)
  EXECUTE FUNCTION public.check_xp_milestones();

-- =====================================================
-- 4. Post Count Milestone Notifications
-- =====================================================
CREATE OR REPLACE FUNCTION public.check_post_milestones()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  post_count INTEGER;
  milestone_reached INTEGER;
BEGIN
  -- Get current post count for the user
  SELECT COUNT(*)
  INTO post_count
  FROM public.posts
  WHERE user_id = NEW.user_id;
  
  -- Check milestones: 1, 10, 50, 100, 500, 1000
  milestone_reached := CASE
    WHEN post_count = 1 THEN 1
    WHEN post_count = 10 THEN 10
    WHEN post_count = 50 THEN 50
    WHEN post_count = 100 THEN 100
    WHEN post_count = 500 THEN 500
    WHEN post_count = 1000 THEN 1000
    ELSE 0
  END;
  
  -- Create milestone notification
  IF milestone_reached > 0 THEN
    INSERT INTO public.notifications (
      user_id, type, title, message,
      data, priority
    ) VALUES (
      NEW.user_id,
      'milestone',
      '📸 Post Milestone Reached!',
      CASE 
        WHEN milestone_reached = 1 THEN 'Congratulations on your first post!'
        ELSE 'You''ve shared ' || milestone_reached || ' posts! Keep creating!'
      END,
      jsonb_build_object(
        'milestone_type', 'posts',
        'milestone_value', milestone_reached,
        'current_count', post_count
      ),
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS post_milestone_trigger ON public.posts;
CREATE TRIGGER post_milestone_trigger
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.check_post_milestones();

-- =====================================================
-- 5. Content Engagement Milestone Notifications
-- =====================================================
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
BEGIN
  -- Don't notify for self-interactions
  IF NEW.user_id = NEW.target_user_id THEN
    RETURN NEW;
  END IF;
  
  -- Only check for likes and shares
  IF NEW.interaction_type NOT IN ('like', 'share') THEN
    RETURN NEW;
  END IF;
  
  -- Get post owner
  post_owner_id := NEW.target_user_id;
  
  IF post_owner_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Count interactions of this type for this post
  SELECT COUNT(*)
  INTO interaction_count
  FROM public.social_interactions
  WHERE target_content_id = NEW.target_content_id
    AND interaction_type = NEW.interaction_type;
  
  -- Check if we hit a milestone
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

DROP TRIGGER IF EXISTS engagement_milestone_trigger ON public.social_interactions;
CREATE TRIGGER engagement_milestone_trigger
  AFTER INSERT ON public.social_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_engagement_milestones();

-- =====================================================
-- 6. Campaign Invitation Notifications
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_campaign_invite_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  campaign_name TEXT;
  inviter_name TEXT;
BEGIN
  -- Get campaign name
  SELECT title
  INTO campaign_name
  FROM public.campaigns
  WHERE id = NEW.campaign_id;
  
  -- Get inviter name (campaign creator)
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

DROP TRIGGER IF EXISTS campaign_invite_notification_trigger ON public.campaign_collaborators;
CREATE TRIGGER campaign_invite_notification_trigger
  AFTER INSERT ON public.campaign_collaborators
  FOR EACH ROW
  EXECUTE FUNCTION public.create_campaign_invite_notification();

-- =====================================================
-- 7. Shoutout/Reward Received Notifications
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_shoutout_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_name TEXT;
  creator_username TEXT;
BEGIN
  -- Only notify when shoutout is sent
  IF NEW.is_sent = false THEN
    RETURN NEW;
  END IF;
  
  -- Don't notify if already notified (update case)
  IF OLD.is_sent = true THEN
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

DROP TRIGGER IF EXISTS shoutout_notification_trigger ON public.shoutouts;
CREATE TRIGGER shoutout_notification_trigger
  AFTER INSERT OR UPDATE ON public.shoutouts
  FOR EACH ROW
  WHEN (NEW.is_sent = true)
  EXECUTE FUNCTION public.create_shoutout_notification();