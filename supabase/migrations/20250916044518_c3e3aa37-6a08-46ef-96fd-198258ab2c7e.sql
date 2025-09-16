-- Enable realtime for marketplace tables
ALTER TABLE marketplace_listings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE marketplace_listings;

ALTER TABLE reward_redemptions REPLICA IDENTITY FULL; 
ALTER PUBLICATION supabase_realtime ADD TABLE reward_redemptions;

ALTER TABLE rewards REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE rewards;

-- Add marketplace listing functionality to reward redemptions
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reward_redemptions' AND column_name = 'can_be_listed') THEN
    ALTER TABLE reward_redemptions ADD COLUMN can_be_listed BOOLEAN DEFAULT true;
    ALTER TABLE reward_redemptions ADD COLUMN is_listed_on_marketplace BOOLEAN DEFAULT false;
    ALTER TABLE reward_redemptions ADD COLUMN marketplace_listing_id UUID REFERENCES marketplace_listings(id);
  END IF;
END $$;

-- Function to execute marketplace purchase with XP
CREATE OR REPLACE FUNCTION public.execute_marketplace_purchase_xp(
  listing_id_param UUID,
  buyer_id_param UUID,
  xp_amount_param INTEGER
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  listing_record marketplace_listings;
  streamcentives_fee INTEGER;
  creator_fee INTEGER;
  net_seller_amount INTEGER;
  transaction_id UUID;
BEGIN
  -- Get and lock listing
  SELECT * INTO listing_record
  FROM marketplace_listings
  WHERE id = listing_id_param AND is_active = true AND is_sold = false
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Listing not found or unavailable');
  END IF;
  
  -- Calculate fees (5% total: 3% streamcentives, 2% original creator)
  streamcentives_fee := FLOOR(xp_amount_param * 0.03);
  creator_fee := FLOOR(xp_amount_param * 0.02);
  net_seller_amount := xp_amount_param - streamcentives_fee - creator_fee;
  
  -- Check buyer has enough XP
  IF NOT EXISTS (
    SELECT 1 FROM user_xp_balances 
    WHERE user_id = buyer_id_param AND current_xp >= xp_amount_param
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient XP balance');
  END IF;
  
  -- Create marketplace transaction
  INSERT INTO marketplace_transactions (
    listing_id, buyer_id, seller_id, payment_method,
    total_amount_cents, streamcentives_fee_cents, net_seller_amount_cents,
    status, completed_at
  ) VALUES (
    listing_id_param, buyer_id_param, listing_record.seller_id, 'xp',
    xp_amount_param, streamcentives_fee, net_seller_amount,
    'completed', now()
  ) RETURNING id INTO transaction_id;
  
  -- Transfer XP: deduct from buyer
  UPDATE user_xp_balances
  SET current_xp = current_xp - xp_amount_param,
      total_spent_xp = total_spent_xp + xp_amount_param,
      updated_at = now()
  WHERE user_id = buyer_id_param;
  
  -- Transfer XP: add to seller (net amount)
  INSERT INTO user_xp_balances (user_id, current_xp, total_earned_xp)
  VALUES (listing_record.seller_id, net_seller_amount, net_seller_amount)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    current_xp = user_xp_balances.current_xp + net_seller_amount,
    total_earned_xp = user_xp_balances.total_earned_xp + net_seller_amount,
    updated_at = now();
  
  -- Transfer the reward redemption to buyer
  UPDATE reward_redemptions 
  SET user_id = buyer_id_param,
      is_listed_on_marketplace = false,
      marketplace_listing_id = NULL,
      updated_at = now()
  WHERE id = listing_record.reward_redemption_id;
  
  -- Mark listing as sold
  UPDATE marketplace_listings
  SET is_sold = true, 
      is_active = false, 
      buyer_id = buyer_id_param, 
      sold_at = now(),
      updated_at = now()
  WHERE id = listing_id_param;
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', transaction_id,
    'net_seller_amount', net_seller_amount,
    'fees', json_build_object(
      'streamcentives_fee', streamcentives_fee,
      'creator_fee', creator_fee
    )
  );
END;
$$;