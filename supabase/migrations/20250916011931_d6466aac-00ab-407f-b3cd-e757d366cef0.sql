-- Enhanced Financial System for Streamcentives (Fixed)
-- 1. XP Type Differentiation System

-- Create XP types enum for different XP categories
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'xp_type') THEN
    CREATE TYPE public.xp_type AS ENUM ('platform', 'creator_specific', 'transferable');
  END IF;
END $$;

-- Create XP balances table with types
CREATE TABLE IF NOT EXISTS public.user_xp_detailed_balances (
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

-- Create policies (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_xp_detailed_balances' AND policyname = 'Users can view their own XP balances') THEN
    CREATE POLICY "Users can view their own XP balances" ON public.user_xp_detailed_balances
    FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_xp_detailed_balances' AND policyname = 'System can manage XP balances') THEN
    CREATE POLICY "System can manage XP balances" ON public.user_xp_detailed_balances
    FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. Enhanced Revenue Settings (with ON CONFLICT)
INSERT INTO public.revenue_settings (setting_name, percentage, description, is_active) VALUES
('xp_purchase_streamcentives_fee', 5.0, 'Streamcentives fee on XP purchases (in cents per dollar)', true),
('reward_marketplace_fee', 5.0, 'Marketplace fee on reward sales', true),
('reward_creator_royalty', 2.0, 'Original creator royalty on marketplace resales', true),
('fan_to_fan_marketplace_buyer_fee', 3.0, 'Buyer fee on fan-to-fan marketplace', true),
('fan_to_fan_marketplace_seller_fee', 2.0, 'Seller fee on fan-to-fan marketplace', true)
ON CONFLICT (setting_name) DO UPDATE SET
  percentage = EXCLUDED.percentage,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- 3. Creator Earnings Enhancements
ALTER TABLE public.creator_earnings ADD COLUMN IF NOT EXISTS transaction_reference UUID;
ALTER TABLE public.creator_earnings ADD COLUMN IF NOT EXISTS fee_breakdown JSONB;
ALTER TABLE public.creator_earnings ADD COLUMN IF NOT EXISTS net_amount_cents INTEGER;

-- 4. Enhanced Reward System
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS creator_xp_only BOOLEAN DEFAULT false;
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS instant_delivery BOOLEAN DEFAULT false;
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'manual';
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS delivery_metadata JSONB;

-- 5. Creator Payout System
CREATE TABLE IF NOT EXISTS public.creator_payout_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL,
  fee_cents INTEGER NOT NULL,
  net_amount_cents INTEGER NOT NULL,
  payout_method TEXT NOT NULL,
  payout_details JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  stripe_payout_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for payout requests
ALTER TABLE public.creator_payout_requests ENABLE ROW LEVEL SECURITY;

-- Payout request policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'creator_payout_requests' AND policyname = 'Creators can view their payout requests') THEN
    CREATE POLICY "Creators can view their payout requests" ON public.creator_payout_requests
    FOR SELECT USING (auth.uid() = creator_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'creator_payout_requests' AND policyname = 'Creators can create payout requests') THEN
    CREATE POLICY "Creators can create payout requests" ON public.creator_payout_requests
    FOR INSERT WITH CHECK (auth.uid() = creator_id);
  END IF;
END $$;

-- 6. XP Purchase Tracking with Revenue Sharing
CREATE TABLE IF NOT EXISTS public.xp_purchase_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  xp_amount INTEGER NOT NULL,
  payment_amount_cents INTEGER NOT NULL,
  streamcentives_fee_cents INTEGER NOT NULL,
  creator_share_cents INTEGER,
  creator_id UUID,
  xp_type public.xp_type NOT NULL DEFAULT 'platform',
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.xp_purchase_transactions ENABLE ROW LEVEL SECURITY;

-- XP purchase policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'xp_purchase_transactions' AND policyname = 'Users can view their XP purchases') THEN
    CREATE POLICY "Users can view their XP purchases" ON public.xp_purchase_transactions
    FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- 7. Enhanced database functions for XP management
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