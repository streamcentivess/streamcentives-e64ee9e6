-- Enhanced reward redemption function with revenue sharing
CREATE OR REPLACE FUNCTION public.enhanced_redeem_reward(
  reward_id_param UUID,
  user_id_param UUID,
  payment_method_param TEXT,
  xp_spent_param INTEGER DEFAULT NULL,
  amount_paid_param NUMERIC DEFAULT NULL,
  xp_type_param public.xp_type DEFAULT 'platform'
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  reward_record public.rewards;
  redemption_id UUID;
  revenue_settings_record public.revenue_settings;
  streamcentives_fee_cents INTEGER := 0;
  creator_net_cents INTEGER := 0;
  redemption_code TEXT;
BEGIN
  -- Get reward details and lock row
  SELECT * INTO reward_record
  FROM public.rewards
  WHERE id = reward_id_param AND is_active = true
  FOR UPDATE;
  
  -- Check if reward exists and is available
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Reward not found or not active');
  END IF;
  
  -- Check if quantity is available
  IF reward_record.quantity_available <= reward_record.quantity_redeemed THEN
    RETURN json_build_object('success', false, 'error', 'Reward is out of stock');
  END IF;
  
  -- Validate payment method and amounts
  IF payment_method_param = 'xp' THEN
    IF reward_record.xp_cost IS NULL OR xp_spent_param IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'XP cost not available for this reward');
    END IF;
    IF xp_spent_param < reward_record.xp_cost THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient XP provided');
    END IF;
  ELSIF payment_method_param = 'cash' THEN
    IF reward_record.cash_price IS NULL OR amount_paid_param IS NULL THEN
      RETURN json_build_object('success', false, 'error', 'Cash price not available for this reward');
    END IF;
    IF amount_paid_param < reward_record.cash_price THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient payment amount');
    END IF;
  END IF;
  
  -- Create redemption record
  INSERT INTO public.reward_redemptions (
    reward_id, user_id, payment_method, amount_paid, xp_spent, status
  ) VALUES (
    reward_id_param, user_id_param, payment_method_param, 
    amount_paid_param, xp_spent_param, 'completed'
  ) RETURNING id INTO redemption_id;
  
  -- Process XP deduction for XP payments
  IF payment_method_param = 'xp' THEN
    IF reward_record.creator_xp_only THEN
      -- Deduct creator-specific XP
      UPDATE public.user_xp_detailed_balances
      SET current_xp = current_xp - xp_spent_param,
          total_spent_xp = total_spent_xp + xp_spent_param,
          updated_at = now()
      WHERE user_id = user_id_param 
        AND xp_type = 'creator_specific' 
        AND creator_id = reward_record.creator_id;
    ELSE
      -- Deduct platform XP
      UPDATE public.user_xp_balances
      SET current_xp = current_xp - xp_spent_param,
          total_spent_xp = total_spent_xp + xp_spent_param,
          updated_at = now()
      WHERE user_id = user_id_param;
    END IF;
  END IF;
  
  -- Handle cash payments with revenue sharing
  IF payment_method_param = 'cash' AND amount_paid_param IS NOT NULL THEN
    -- Get marketplace fee settings
    SELECT * INTO revenue_settings_record
    FROM public.revenue_settings
    WHERE setting_name = 'reward_marketplace_fee' AND is_active = true;
    
    streamcentives_fee_cents := FLOOR(amount_paid_param * 100 * (revenue_settings_record.percentage / 100.0));
    creator_net_cents := (amount_paid_param * 100) - streamcentives_fee_cents;
    
    -- Record revenue transaction
    INSERT INTO public.revenue_transactions (
      transaction_type, user_id, creator_id, amount_total_cents, 
      streamcentives_fee_cents, net_amount_cents, status
    ) VALUES (
      'reward_purchase', user_id_param, reward_record.creator_id, 
      (amount_paid_param * 100)::INTEGER, streamcentives_fee_cents, creator_net_cents, 'completed'
    );
    
    -- Add to creator earnings
    INSERT INTO public.creator_earnings (
      creator_id, earnings_type, amount_cents, net_amount_cents, 
      transaction_reference, fee_breakdown
    ) VALUES (
      reward_record.creator_id, 'reward_sale', creator_net_cents, creator_net_cents,
      redemption_id, jsonb_build_object('streamcentives_fee', streamcentives_fee_cents)
    );
  END IF;
  
  -- Generate redemption code for certain delivery types
  IF reward_record.delivery_type IN ('code', 'instant') THEN
    redemption_code := public.generate_redemption_code();
    
    INSERT INTO public.reward_redemption_codes (redemption_id, redemption_code)
    VALUES (redemption_id, redemption_code);
  END IF;
  
  -- Update reward redemption count
  UPDATE public.rewards
  SET quantity_redeemed = quantity_redeemed + 1
  WHERE id = reward_id_param;
  
  -- Handle instant delivery
  IF reward_record.instant_delivery THEN
    -- Process instant delivery based on type
    CASE reward_record.delivery_type
      WHEN 'follow' THEN
        -- Create follow relationship instantly
        INSERT INTO public.follows (follower_id, following_id)
        VALUES (reward_record.creator_id, user_id_param)
        ON CONFLICT DO NOTHING;
      WHEN 'code' THEN
        -- Redemption code already generated above
        NULL;
      ELSE
        -- Other instant delivery types can be handled here
        NULL;
    END CASE;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'redemption_id', redemption_id,
    'redemption_code', redemption_code,
    'instant_delivery', reward_record.instant_delivery,
    'delivery_type', reward_record.delivery_type,
    'creator_earnings', creator_net_cents,
    'streamcentives_fee', streamcentives_fee_cents
  );
END;
$$;

-- Marketplace transaction processing function
CREATE OR REPLACE FUNCTION public.process_marketplace_transaction(
  listing_id_param UUID,
  buyer_id_param UUID,
  payment_method_param TEXT,
  amount_param INTEGER
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  listing_record public.marketplace_listings;
  transaction_id UUID;
  buyer_fee INTEGER := 0;
  seller_fee INTEGER := 0;
  streamcentives_fee INTEGER := 0;
  creator_royalty INTEGER := 0;
  net_seller_amount INTEGER := 0;
BEGIN
  -- Get listing details
  SELECT * INTO listing_record
  FROM public.marketplace_listings
  WHERE id = listing_id_param AND is_active = true AND is_sold = false
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Listing not found or unavailable');
  END IF;
  
  -- Calculate fees based on revenue settings
  SELECT COALESCE(percentage, 3.0) INTO buyer_fee
  FROM public.revenue_settings 
  WHERE setting_name = 'fan_to_fan_marketplace_buyer_fee' AND is_active = true;
  
  SELECT COALESCE(percentage, 2.0) INTO seller_fee
  FROM public.revenue_settings 
  WHERE setting_name = 'fan_to_fan_marketplace_seller_fee' AND is_active = true;
  
  SELECT COALESCE(percentage, 2.0) INTO creator_royalty
  FROM public.revenue_settings 
  WHERE setting_name = 'reward_creator_royalty' AND is_active = true;
  
  -- Calculate actual fee amounts
  buyer_fee := FLOOR(amount_param * (buyer_fee / 100.0));
  seller_fee := FLOOR(amount_param * (seller_fee / 100.0));
  creator_royalty := FLOOR(amount_param * (creator_royalty / 100.0));
  streamcentives_fee := buyer_fee + seller_fee;
  net_seller_amount := amount_param - seller_fee - creator_royalty;
  
  -- Create marketplace transaction
  INSERT INTO public.marketplace_transactions (
    listing_id, buyer_id, seller_id, payment_method, 
    total_amount_cents, buyer_fee_cents, seller_fee_cents,
    streamcentives_fee_cents, creator_royalty_cents, 
    net_seller_amount_cents, status, completed_at
  ) VALUES (
    listing_id_param, buyer_id_param, listing_record.seller_id, payment_method_param,
    amount_param, buyer_fee, seller_fee, streamcentives_fee, creator_royalty,
    net_seller_amount, 'completed', now()
  ) RETURNING id INTO transaction_id;
  
  -- Update listing as sold
  UPDATE public.marketplace_listings
  SET is_sold = true, is_active = false, buyer_id = buyer_id_param, sold_at = now()
  WHERE id = listing_id_param;
  
  -- Process payment and transfers based on method
  IF payment_method_param = 'cash' THEN
    -- Add seller earnings
    INSERT INTO public.creator_earnings (
      creator_id, earnings_type, amount_cents, net_amount_cents,
      transaction_reference, fee_breakdown
    ) VALUES (
      listing_record.seller_id, 'marketplace_sale', net_seller_amount, net_seller_amount,
      transaction_id, jsonb_build_object(
        'seller_fee', seller_fee,
        'creator_royalty', creator_royalty,
        'buyer_fee', buyer_fee
      )
    );
    
    -- Add creator royalty if applicable
    IF creator_royalty > 0 THEN
      -- Get original creator from reward
      DECLARE original_creator_id UUID;
      BEGIN
        SELECT r.creator_id INTO original_creator_id
        FROM public.reward_redemptions rr
        JOIN public.rewards r ON rr.reward_id = r.id
        WHERE rr.id = listing_record.reward_redemption_id;
        
        IF original_creator_id IS NOT NULL AND original_creator_id != listing_record.seller_id THEN
          INSERT INTO public.creator_earnings (
            creator_id, earnings_type, amount_cents, net_amount_cents,
            transaction_reference, fee_breakdown
          ) VALUES (
            original_creator_id, 'marketplace_royalty', creator_royalty, creator_royalty,
            transaction_id, jsonb_build_object('royalty_percentage', creator_royalty)
          );
        END IF;
      END;
    END IF;
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', transaction_id,
    'net_seller_amount', net_seller_amount,
    'fees', jsonb_build_object(
      'buyer_fee', buyer_fee,
      'seller_fee', seller_fee,
      'creator_royalty', creator_royalty,
      'streamcentives_fee', streamcentives_fee
    )
  );
END;
$$;