-- Fix remaining security issues

-- 1. Fix remaining functions that need explicit search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = 'public'  -- Add explicit search_path
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_message_status(message_id_param uuid, new_status_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'  -- Add explicit search_path
AS $$
DECLARE
  message_record public.messages;
BEGIN
  -- Get message and verify recipient
  SELECT * INTO message_record
  FROM public.messages
  WHERE id = message_id_param AND recipient_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found or you are not authorized to update it';
  END IF;
  
  -- Validate status
  IF new_status_param NOT IN ('approved', 'denied') THEN
    RAISE EXCEPTION 'Invalid status. Must be approved or denied';
  END IF;
  
  -- Update message status
  UPDATE public.messages
  SET status = new_status_param,
      approved_at = CASE WHEN new_status_param = 'approved' THEN now() ELSE NULL END,
      denied_at = CASE WHEN new_status_param = 'denied' THEN now() ELSE NULL END,
      updated_at = now()
  WHERE id = message_id_param;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.redeem_reward(reward_id_param uuid, payment_method_param text, xp_spent_param integer DEFAULT NULL::integer, amount_paid_param numeric DEFAULT NULL::numeric)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'auth'  -- Add explicit search_path
AS $$
DECLARE
  reward_record public.rewards;
  redemption_id UUID;
BEGIN
  -- Get reward details and lock row
  SELECT * INTO reward_record
  FROM public.rewards
  WHERE id = reward_id_param AND is_active = true
  FOR UPDATE;
  
  -- Check if reward exists and is available
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward not found or not active';
  END IF;
  
  -- Check if quantity is available
  IF reward_record.quantity_available <= reward_record.quantity_redeemed THEN
    RAISE EXCEPTION 'Reward is out of stock';
  END IF;
  
  -- Validate payment method
  IF payment_method_param = 'xp' THEN
    IF reward_record.xp_cost IS NULL OR xp_spent_param IS NULL THEN
      RAISE EXCEPTION 'XP cost not available for this reward';
    END IF;
    IF xp_spent_param < reward_record.xp_cost THEN
      RAISE EXCEPTION 'Insufficient XP provided';
    END IF;
  ELSIF payment_method_param = 'cash' THEN
    IF reward_record.cash_price IS NULL OR amount_paid_param IS NULL THEN
      RAISE EXCEPTION 'Cash price not available for this reward';
    END IF;
    IF amount_paid_param < reward_record.cash_price THEN
      RAISE EXCEPTION 'Insufficient payment amount';
    END IF;
  END IF;
  
  -- Create redemption record
  INSERT INTO public.reward_redemptions (
    reward_id,
    user_id,
    payment_method,
    amount_paid,
    xp_spent,
    status
  ) VALUES (
    reward_id_param,
    auth.uid(),
    payment_method_param,
    amount_paid_param,
    xp_spent_param,
    'completed'
  ) RETURNING id INTO redemption_id;
  
  -- Update reward redemption count
  UPDATE public.rewards
  SET quantity_redeemed = quantity_redeemed + 1
  WHERE id = reward_id_param;
  
  RETURN redemption_id;
END;
$$;

-- 2. Create a secure public profiles function that only returns safe data
CREATE OR REPLACE FUNCTION public.get_public_profile_data(profile_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  spotify_connected boolean,
  merch_store_connected boolean,
  created_at timestamp with time zone,
  country_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only return safe, non-sensitive profile information
  RETURN QUERY
  SELECT 
    p.user_id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.bio,
    p.spotify_connected,
    p.merch_store_connected,
    p.created_at,
    p.country_name
  FROM public.profiles p
  WHERE p.user_id = profile_user_id;
END;
$$;