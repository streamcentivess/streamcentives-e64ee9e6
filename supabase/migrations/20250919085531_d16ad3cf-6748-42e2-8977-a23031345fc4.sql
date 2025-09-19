-- Create database functions for the XP economy system

-- Function to execute marketplace purchase with XP
CREATE OR REPLACE FUNCTION public.execute_marketplace_purchase_xp(
  listing_id_param UUID,
  buyer_id_param UUID,
  total_xp_amount_param INTEGER,
  platform_fee_xp_param INTEGER,
  seller_net_xp_param INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  listing_record marketplace_listings;
  transaction_id UUID;
BEGIN
  -- Get and lock the listing
  SELECT * INTO listing_record
  FROM marketplace_listings
  WHERE id = listing_id_param 
    AND is_active = true 
    AND is_sold = false
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Listing not found or unavailable');
  END IF;
  
  -- Verify buyer has sufficient XP
  IF NOT EXISTS (
    SELECT 1 FROM user_xp_balances 
    WHERE user_id = buyer_id_param 
      AND current_xp >= total_xp_amount_param
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient XP balance');
  END IF;
  
  -- Create marketplace transaction record
  INSERT INTO marketplace_transactions (
    listing_id, buyer_id, seller_id, payment_method,
    total_amount_cents, buyer_fee_cents, seller_fee_cents,
    streamcentives_fee_cents, net_seller_amount_cents,
    status, completed_at
  ) VALUES (
    listing_id_param, buyer_id_param, listing_record.seller_id, 'xp',
    total_xp_amount_param, 0, platform_fee_xp_param,
    platform_fee_xp_param, seller_net_xp_param,
    'completed', now()
  ) RETURNING id INTO transaction_id;
  
  -- Update buyer's XP balance (deduct full amount)
  UPDATE user_xp_balances
  SET current_xp = current_xp - total_xp_amount_param,
      total_spent_xp = COALESCE(total_spent_xp, 0) + total_xp_amount_param,
      updated_at = now()
  WHERE user_id = buyer_id_param;
  
  -- Update seller's XP balance (add net amount)
  INSERT INTO user_xp_balances (user_id, current_xp, total_earned_xp)
  VALUES (listing_record.seller_id, seller_net_xp_param, seller_net_xp_param)
  ON CONFLICT (user_id)
  DO UPDATE SET
    current_xp = user_xp_balances.current_xp + seller_net_xp_param,
    total_earned_xp = user_xp_balances.total_earned_xp + seller_net_xp_param,
    updated_at = now();
  
  -- Mark listing as sold
  UPDATE marketplace_listings
  SET is_sold = true,
      is_active = false,
      buyer_id = buyer_id_param,
      sold_at = now()
  WHERE id = listing_id_param;
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', transaction_id,
    'total_xp_amount', total_xp_amount_param,
    'platform_fee_xp', platform_fee_xp_param,
    'seller_net_xp', seller_net_xp_param
  );
END;
$$;

-- Enhanced function to handle XP purchase with detailed revenue sharing
CREATE OR REPLACE FUNCTION public.handle_enhanced_xp_purchase(
  user_id_param UUID,
  fan_xp_share_param INTEGER,
  platform_xp_share_param INTEGER,
  payment_amount_cents_param INTEGER,
  creator_id_param UUID DEFAULT NULL,
  xp_type_param xp_type DEFAULT 'platform'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  transaction_id UUID;
BEGIN
  -- Update user's XP balance with fan share
  INSERT INTO user_xp_balances (user_id, current_xp, total_earned_xp)
  VALUES (user_id_param, fan_xp_share_param, fan_xp_share_param)
  ON CONFLICT (user_id)
  DO UPDATE SET
    current_xp = user_xp_balances.current_xp + fan_xp_share_param,
    total_earned_xp = user_xp_balances.total_earned_xp + fan_xp_share_param,
    updated_at = now();
  
  -- Update detailed XP balance if creator-specific
  IF creator_id_param IS NOT NULL THEN
    INSERT INTO user_xp_detailed_balances (
      user_id, xp_type, creator_id, current_xp, total_earned_xp
    ) VALUES (
      user_id_param, xp_type_param, creator_id_param, fan_xp_share_param, fan_xp_share_param
    )
    ON CONFLICT (user_id, xp_type, creator_id)
    DO UPDATE SET
      current_xp = user_xp_detailed_balances.current_xp + fan_xp_share_param,
      total_earned_xp = user_xp_detailed_balances.total_earned_xp + fan_xp_share_param,
      updated_at = now();
  END IF;
  
  -- Record in XP purchase transactions
  INSERT INTO xp_purchase_transactions (
    user_id, xp_amount, payment_amount_cents, streamcentives_fee_cents,
    creator_share_cents, creator_id, xp_type, status
  ) VALUES (
    user_id_param, fan_xp_share_param + platform_xp_share_param, payment_amount_cents_param,
    FLOOR(payment_amount_cents_param * 0.2), -- 20% platform fee
    CASE WHEN creator_id_param IS NOT NULL THEN FLOOR(payment_amount_cents_param * 0.8) ELSE 0 END,
    creator_id_param, xp_type_param, 'completed'
  ) RETURNING id INTO transaction_id;
  
  -- Add creator earnings if applicable
  IF creator_id_param IS NOT NULL THEN
    INSERT INTO creator_earnings (
      creator_id, earnings_type, amount_cents, net_amount_cents,
      transaction_reference, fee_breakdown
    ) VALUES (
      creator_id_param, 'xp_sales', 
      FLOOR(payment_amount_cents_param * 0.8), 
      FLOOR(payment_amount_cents_param * 0.8),
      transaction_id, 
      jsonb_build_object('streamcentives_fee', FLOOR(payment_amount_cents_param * 0.2))
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', transaction_id,
    'fan_xp_awarded', fan_xp_share_param,
    'platform_xp_share', platform_xp_share_param
  );
END;
$$;

-- Function to process Stripe payouts for creator cash-outs
CREATE OR REPLACE FUNCTION public.process_creator_payout(
  payout_request_id_param UUID,
  stripe_payout_id_param TEXT,
  bank_account_last4_param TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payout_record creator_payouts;
  transaction_id UUID;
BEGIN
  -- Get payout request
  SELECT * INTO payout_record
  FROM creator_payouts
  WHERE id = payout_request_id_param
    AND status = 'pending'
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Payout request not found or already processed');
  END IF;
  
  -- Update payout request
  UPDATE creator_payouts
  SET status = 'completed',
      stripe_payout_id = stripe_payout_id_param,
      bank_account_last4 = bank_account_last4_param,
      processed_at = now(),
      updated_at = now()
  WHERE id = payout_request_id_param;
  
  -- Log fiat payout transaction
  INSERT INTO transactions (
    user_id, amount_value, currency_type, type, status, stripe_id,
    metadata
  ) VALUES (
    payout_record.creator_id, payout_record.net_amount_cents, 'FIAT',
    'CREATOR_CASH_OUT_PAYOUT', 'completed', stripe_payout_id_param,
    jsonb_build_object(
      'payout_request_id', payout_request_id_param,
      'xp_amount', payout_record.xp_amount,
      'fee_amount_cents', payout_record.fee_amount_cents,
      'gross_amount_cents', payout_record.fiat_amount_cents
    )
  ) RETURNING id INTO transaction_id;
  
  -- Log platform fee transaction
  INSERT INTO transactions (
    user_id, related_user_id, amount_value, currency_type, type, status,
    metadata
  ) VALUES (
    'platform', payout_record.creator_id, payout_record.fee_amount_cents, 'FIAT',
    'CASH_OUT_FEE_FIAT', 'completed',
    jsonb_build_object(
      'payout_request_id', payout_request_id_param,
      'original_xp_amount', payout_record.xp_amount
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'payout_request_id', payout_request_id_param,
    'transaction_id', transaction_id,
    'net_amount_cents', payout_record.net_amount_cents,
    'stripe_payout_id', stripe_payout_id_param
  );
END;
$$;

-- Function to handle reward sales in XP
CREATE OR REPLACE FUNCTION public.handle_reward_sale_xp(
  reward_id_param UUID,
  buyer_id_param UUID,
  seller_id_param UUID,
  xp_price_param INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  platform_fee INTEGER;
  seller_net INTEGER;
  transaction_id UUID;
BEGIN
  -- Calculate 2% platform fee
  platform_fee := FLOOR(xp_price_param * 0.02);
  seller_net := xp_price_param - platform_fee;
  
  -- Verify buyer has sufficient XP
  IF NOT EXISTS (
    SELECT 1 FROM user_xp_balances 
    WHERE user_id = buyer_id_param 
      AND current_xp >= xp_price_param
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient XP balance');
  END IF;
  
  -- Deduct XP from buyer
  UPDATE user_xp_balances
  SET current_xp = current_xp - xp_price_param,
      total_spent_xp = COALESCE(total_spent_xp, 0) + xp_price_param,
      updated_at = now()
  WHERE user_id = buyer_id_param;
  
  -- Add net XP to seller
  INSERT INTO user_xp_balances (user_id, current_xp, total_earned_xp)
  VALUES (seller_id_param, seller_net, seller_net)
  ON CONFLICT (user_id)
  DO UPDATE SET
    current_xp = user_xp_balances.current_xp + seller_net,
    total_earned_xp = user_xp_balances.total_earned_xp + seller_net,
    updated_at = now();
  
  -- Log sale transaction
  INSERT INTO transactions (
    user_id, related_user_id, amount_value, currency_type, type, status,
    metadata
  ) VALUES (
    buyer_id_param, seller_id_param, xp_price_param, 'XP',
    'REWARD_SALE_XP', 'completed',
    jsonb_build_object(
      'reward_id', reward_id_param,
      'platform_fee', platform_fee,
      'seller_net', seller_net
    )
  ) RETURNING id INTO transaction_id;
  
  -- Log platform fee
  INSERT INTO transactions (
    user_id, related_user_id, amount_value, currency_type, type, status,
    metadata
  ) VALUES (
    'platform', buyer_id_param, platform_fee, 'XP',
    'MARKETPLACE_FEE_XP', 'completed',
    jsonb_build_object(
      'reward_id', reward_id_param,
      'original_price', xp_price_param,
      'seller_id', seller_id_param
    )
  );
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', transaction_id,
    'total_paid', xp_price_param,
    'platform_fee', platform_fee,
    'seller_received', seller_net
  );
END;
$$;