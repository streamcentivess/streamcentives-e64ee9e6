-- Fix search_path security issues for existing functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN new;
END;
$function$;

-- Fix search_path for update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Fix search_path for redeem_reward function
CREATE OR REPLACE FUNCTION public.redeem_reward(
  reward_id_param UUID,
  payment_method_param TEXT,
  xp_spent_param INTEGER DEFAULT NULL,
  amount_paid_param DECIMAL DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
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