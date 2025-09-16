-- Enhanced Financial System for Streamcentives
-- 1. XP Type Differentiation System

-- Create XP types enum for different XP categories
CREATE TYPE public.xp_type AS ENUM ('platform', 'creator_specific', 'transferable');

-- Create XP balances table with types
CREATE TABLE public.user_xp_detailed_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  xp_type public.xp_type NOT NULL,
  creator_id UUID NULL, -- For creator-specific XP
  current_xp INTEGER NOT NULL DEFAULT 0,
  total_earned_xp INTEGER NOT NULL DEFAULT 0,
  total_spent_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, xp_type, creator_id)
);

-- Enable RLS
ALTER TABLE public.user_xp_detailed_balances ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own XP balances" ON public.user_xp_detailed_balances
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage XP balances" ON public.user_xp_detailed_balances
FOR ALL USING (true) WITH CHECK (true);

-- 2. Enhanced Revenue Settings

-- Add more granular revenue settings
INSERT INTO public.revenue_settings (setting_name, percentage, description, is_active) VALUES
('xp_purchase_streamcentives_fee', 5.0, 'Streamcentives fee on XP purchases (in cents per dollar)', true),
('reward_marketplace_fee', 5.0, 'Marketplace fee on reward sales', true),
('reward_creator_royalty', 2.0, 'Original creator royalty on marketplace resales', true),
('creator_cashout_fee', 2.5, 'Fee for creator cash withdrawals', true),
('fan_to_fan_marketplace_buyer_fee', 3.0, 'Buyer fee on fan-to-fan marketplace', true),
('fan_to_fan_marketplace_seller_fee', 2.0, 'Seller fee on fan-to-fan marketplace', true);

-- 3. Creator Earnings Enhancements

-- Add earnings categories
ALTER TABLE public.creator_earnings ADD COLUMN IF NOT EXISTS transaction_reference UUID;
ALTER TABLE public.creator_earnings ADD COLUMN IF NOT EXISTS fee_breakdown JSONB;
ALTER TABLE public.creator_earnings ADD COLUMN IF NOT EXISTS net_amount_cents INTEGER;

-- 4. Enhanced Reward System

-- Add creator-specific XP requirement to rewards
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS creator_xp_only BOOLEAN DEFAULT false;
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS instant_delivery BOOLEAN DEFAULT false;
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'manual'; -- 'instant', 'code', 'manual', 'external'
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS delivery_metadata JSONB;

-- 5. Creator Payout System

CREATE TABLE public.creator_payout_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL,
  fee_cents INTEGER NOT NULL,
  net_amount_cents INTEGER NOT NULL,
  payout_method TEXT NOT NULL, -- 'bank_transfer', 'paypal', 'stripe'
  payout_details JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  stripe_payout_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.creator_payout_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view their payout requests" ON public.creator_payout_requests
FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Creators can create payout requests" ON public.creator_payout_requests
FOR INSERT WITH CHECK (auth.uid() = creator_id);

-- 6. XP Purchase Tracking with Revenue Sharing

CREATE TABLE public.xp_purchase_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  xp_amount INTEGER NOT NULL,
  payment_amount_cents INTEGER NOT NULL,
  streamcentives_fee_cents INTEGER NOT NULL,
  creator_share_cents INTEGER,
  creator_id UUID, -- For creator-specific XP purchases
  xp_type public.xp_type NOT NULL DEFAULT 'platform',
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.xp_purchase_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their XP purchases" ON public.xp_purchase_transactions
FOR SELECT USING (auth.uid() = user_id);

-- 7. Marketplace Transaction Enhancements

CREATE TABLE public.marketplace_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  original_creator_id UUID, -- For royalty payments
  payment_method TEXT NOT NULL, -- 'xp', 'cash'
  total_amount_cents INTEGER,
  total_amount_xp INTEGER,
  buyer_fee_cents INTEGER DEFAULT 0,
  seller_fee_cents INTEGER DEFAULT 0,
  streamcentives_fee_cents INTEGER DEFAULT 0,
  creator_royalty_cents INTEGER DEFAULT 0,
  net_seller_amount_cents INTEGER DEFAULT 0,
  net_seller_amount_xp INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their marketplace transactions" ON public.marketplace_transactions
FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- 8. Triggers for automatic timestamp updates
CREATE TRIGGER update_user_xp_detailed_balances_updated_at
BEFORE UPDATE ON public.user_xp_detailed_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creator_payout_requests_updated_at
BEFORE UPDATE ON public.creator_payout_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Indexes for performance
CREATE INDEX idx_user_xp_detailed_balances_user_id ON public.user_xp_detailed_balances(user_id);
CREATE INDEX idx_user_xp_detailed_balances_creator_id ON public.user_xp_detailed_balances(creator_id);
CREATE INDEX idx_creator_payout_requests_creator_id ON public.creator_payout_requests(creator_id);
CREATE INDEX idx_marketplace_transactions_buyer_seller ON public.marketplace_transactions(buyer_id, seller_id);

-- 10. Enhanced database functions for XP management

CREATE OR REPLACE FUNCTION public.handle_xp_purchase_with_revenue_sharing(
  user_id_param UUID,
  xp_amount_param INTEGER,
  payment_amount_cents_param INTEGER,
  creator_id_param UUID DEFAULT NULL,
  xp_type_param public.xp_type DEFAULT 'platform'
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  streamcentives_fee_cents INTEGER;
  creator_share_cents INTEGER := 0;
  transaction_id UUID;
BEGIN
  -- Calculate Streamcentives fee (50 cents)
  streamcentives_fee_cents := 50;
  
  -- Calculate creator share if creator-specific XP
  IF creator_id_param IS NOT NULL THEN
    creator_share_cents := payment_amount_cents_param - streamcentives_fee_cents;
  END IF;
  
  -- Insert transaction record
  INSERT INTO public.xp_purchase_transactions (
    user_id, xp_amount, payment_amount_cents, streamcentives_fee_cents,
    creator_share_cents, creator_id, xp_type, status
  ) VALUES (
    user_id_param, xp_amount_param, payment_amount_cents_param, 
    streamcentives_fee_cents, creator_share_cents, creator_id_param, 
    xp_type_param, 'completed'
  ) RETURNING id INTO transaction_id;
  
  -- Update user XP balance
  INSERT INTO public.user_xp_detailed_balances (
    user_id, xp_type, creator_id, current_xp, total_earned_xp
  ) VALUES (
    user_id_param, xp_type_param, creator_id_param, xp_amount_param, xp_amount_param
  )
  ON CONFLICT (user_id, xp_type, creator_id)
  DO UPDATE SET
    current_xp = user_xp_detailed_balances.current_xp + xp_amount_param,
    total_earned_xp = user_xp_detailed_balances.total_earned_xp + xp_amount_param,
    updated_at = now();
  
  -- Update legacy XP balance for backwards compatibility
  INSERT INTO public.user_xp_balances (user_id, current_xp, total_earned_xp)
  VALUES (user_id_param, xp_amount_param, xp_amount_param)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    current_xp = user_xp_balances.current_xp + xp_amount_param,
    total_earned_xp = user_xp_balances.total_earned_xp + xp_amount_param,
    updated_at = now();
  
  -- Add creator earnings if applicable
  IF creator_id_param IS NOT NULL AND creator_share_cents > 0 THEN
    INSERT INTO public.creator_earnings (
      creator_id, earnings_type, amount_cents, net_amount_cents,
      transaction_reference, fee_breakdown
    ) VALUES (
      creator_id_param, 'xp_sales', creator_share_cents, creator_share_cents,
      transaction_id, jsonb_build_object('streamcentives_fee', streamcentives_fee_cents)
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'transaction_id', transaction_id,
    'streamcentives_fee_cents', streamcentives_fee_cents,
    'creator_share_cents', creator_share_cents
  );
END;
$$;