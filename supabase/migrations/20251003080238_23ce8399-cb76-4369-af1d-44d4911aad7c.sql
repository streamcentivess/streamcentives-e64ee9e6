-- Add new notification preference columns
ALTER TABLE public.notification_preferences
ADD COLUMN IF NOT EXISTS offer_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS reward_purchase_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS campaign_join_notifications BOOLEAN DEFAULT true;

-- Trigger for reward purchases (when fan redeems a reward)
CREATE OR REPLACE FUNCTION public.create_reward_purchase_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  fan_name TEXT;
  reward_name TEXT;
  creator_user_id UUID;
  preferences_enabled BOOLEAN;
BEGIN
  -- Get reward and creator info
  SELECT r.creator_id, r.title
  INTO creator_user_id, reward_name
  FROM public.rewards r
  WHERE r.id = NEW.reward_id;
  
  IF creator_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Don't notify if creator redeemed their own reward
  IF NEW.user_id = creator_user_id THEN
    RETURN NEW;
  END IF;
  
  -- Check if user has reward purchase notifications enabled
  SELECT COALESCE(reward_purchase_notifications, true)
  INTO preferences_enabled
  FROM public.notification_preferences
  WHERE user_id = creator_user_id;
  
  IF preferences_enabled = false THEN
    RETURN NEW;
  END IF;
  
  -- Get fan name
  SELECT COALESCE(display_name, username, 'A fan')
  INTO fan_name
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- Create notification
  INSERT INTO public.notifications (
    user_id, type, title, message,
    data, priority, action_url
  ) VALUES (
    creator_user_id,
    'reward_purchased',
    '🎁 Reward Redeemed!',
    fan_name || ' redeemed your reward: ' || reward_name,
    jsonb_build_object(
      'reward_id', NEW.reward_id,
      'redemption_id', NEW.id,
      'fan_id', NEW.user_id,
      'fan_name', fan_name,
      'reward_name', reward_name
    ),
    'high',
    '/manage-rewards'
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reward_purchase_notification_trigger ON public.reward_redemptions;
CREATE TRIGGER reward_purchase_notification_trigger
AFTER INSERT ON public.reward_redemptions
FOR EACH ROW
EXECUTE FUNCTION public.create_reward_purchase_notification();

-- Trigger for campaign joins (when fan joins a campaign)
CREATE OR REPLACE FUNCTION public.create_campaign_join_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  fan_name TEXT;
  campaign_name TEXT;
  creator_user_id UUID;
  preferences_enabled BOOLEAN;
BEGIN
  -- Get campaign and creator info
  SELECT c.creator_id, c.title
  INTO creator_user_id, campaign_name
  FROM public.campaigns c
  WHERE c.id = NEW.campaign_id;
  
  IF creator_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Don't notify if creator joined their own campaign
  IF NEW.user_id = creator_user_id THEN
    RETURN NEW;
  END IF;
  
  -- Check if user has campaign join notifications enabled
  SELECT COALESCE(campaign_join_notifications, true)
  INTO preferences_enabled
  FROM public.notification_preferences
  WHERE user_id = creator_user_id;
  
  IF preferences_enabled = false THEN
    RETURN NEW;
  END IF;
  
  -- Get fan name
  SELECT COALESCE(display_name, username, 'A fan')
  INTO fan_name
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- Create notification
  INSERT INTO public.notifications (
    user_id, type, title, message,
    data, priority, action_url
  ) VALUES (
    creator_user_id,
    'campaign_join',
    '🎯 New Campaign Participant!',
    fan_name || ' joined your campaign: ' || campaign_name,
    jsonb_build_object(
      'campaign_id', NEW.campaign_id,
      'participant_id', NEW.id,
      'fan_id', NEW.user_id,
      'fan_name', fan_name,
      'campaign_name', campaign_name
    ),
    'normal',
    '/campaigns'
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS campaign_join_notification_trigger ON public.campaign_participants;
CREATE TRIGGER campaign_join_notification_trigger
AFTER INSERT ON public.campaign_participants
FOR EACH ROW
EXECUTE FUNCTION public.create_campaign_join_notification();

-- Trigger for sponsor offers (when sponsor creates an offer)
CREATE OR REPLACE FUNCTION public.create_sponsor_offer_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  sponsor_name TEXT;
  sponsor_company TEXT;
  preferences_enabled BOOLEAN;
BEGIN
  -- Don't notify if offer already has notification (update scenario)
  IF TG_OP = 'UPDATE' THEN
    RETURN NEW;
  END IF;
  
  -- Check if creator has offer notifications enabled
  SELECT COALESCE(offer_notifications, true)
  INTO preferences_enabled
  FROM public.notification_preferences
  WHERE user_id = NEW.creator_id;
  
  IF preferences_enabled = false THEN
    RETURN NEW;
  END IF;
  
  -- Get sponsor info
  SELECT 
    COALESCE(sp.company_name, p.display_name, p.username, 'A sponsor'),
    sp.company_name
  INTO sponsor_name, sponsor_company
  FROM public.profiles p
  LEFT JOIN public.sponsor_profiles sp ON sp.user_id = p.user_id
  WHERE p.user_id = NEW.sponsor_id;
  
  -- Create notification
  INSERT INTO public.notifications (
    user_id, type, title, message,
    data, priority, action_url
  ) VALUES (
    NEW.creator_id,
    'sponsor_offer',
    '💼 New Sponsor Offer!',
    sponsor_name || ' sent you an offer: ' || NEW.offer_title,
    jsonb_build_object(
      'offer_id', NEW.id,
      'sponsor_id', NEW.sponsor_id,
      'sponsor_name', sponsor_name,
      'offer_title', NEW.offer_title,
      'offer_amount_cents', NEW.offer_amount_cents
    ),
    'high',
    '/sponsor-dashboard'
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sponsor_offer_notification_trigger ON public.sponsor_offers;
CREATE TRIGGER sponsor_offer_notification_trigger
AFTER INSERT ON public.sponsor_offers
FOR EACH ROW
EXECUTE FUNCTION public.create_sponsor_offer_notification();