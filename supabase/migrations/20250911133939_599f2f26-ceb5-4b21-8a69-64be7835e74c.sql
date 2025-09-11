-- Revenue Sharing and Marketplace System

-- Table to track revenue sharing percentages and fees
CREATE TABLE public.revenue_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_name TEXT NOT NULL UNIQUE,
  percentage DECIMAL(5,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default revenue settings
INSERT INTO public.revenue_settings (setting_name, percentage, description) VALUES
('xp_purchase_fee', 15.00, 'StreamCentives fee when users buy XP'),
('creator_cashout_fee', 5.00, 'Fee when creators cash out earnings'),
('buyer_tax_fee', 8.00, 'Tax fee charged to buyers'),
('marketplace_fee', 10.00, 'Fee for marketplace transactions');

-- Table to track all revenue transactions
CREATE TABLE public.revenue_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type TEXT NOT NULL, -- 'xp_purchase', 'reward_purchase', 'creator_cashout', 'marketplace_sale'
  user_id UUID REFERENCES auth.users(id),
  creator_id UUID REFERENCES auth.users(id),
  amount_total_cents INTEGER NOT NULL,
  streamcentives_fee_cents INTEGER NOT NULL,
  net_amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  stripe_session_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for marketplace listings (fan-to-fan trading)
CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  reward_redemption_id UUID NOT NULL REFERENCES public.reward_redemptions(id),
  asking_price_cents INTEGER NOT NULL,
  asking_price_xp INTEGER,
  currency TEXT DEFAULT 'usd',
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  is_sold BOOLEAN DEFAULT false,
  buyer_id UUID REFERENCES auth.users(id),
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for AI tool subscriptions
CREATE TABLE public.ai_tool_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tool_name TEXT NOT NULL,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  plan_type TEXT NOT NULL, -- 'basic', 'pro', 'enterprise'
  monthly_price_cents INTEGER NOT NULL,
  usage_count INTEGER DEFAULT 0,
  usage_limit INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for reward redemption codes (physical redemption)
CREATE TABLE public.reward_redemption_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  redemption_id UUID NOT NULL REFERENCES public.reward_redemptions(id),
  redemption_code TEXT NOT NULL UNIQUE,
  is_redeemed BOOLEAN DEFAULT false,
  redeemed_at TIMESTAMPTZ,
  redeemed_by TEXT, -- store name, person, etc.
  location_redeemed TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for creator earnings tracking
CREATE TABLE public.creator_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  earnings_type TEXT NOT NULL, -- 'reward_sale', 'campaign_completion'
  amount_cents INTEGER NOT NULL,
  source_transaction_id UUID,
  payout_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  payout_method TEXT, -- 'stripe', 'paypal', 'bank_transfer'
  payout_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.revenue_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_tool_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemption_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for revenue_settings (admin only)
CREATE POLICY "Revenue settings are viewable by all authenticated users" ON public.revenue_settings
FOR SELECT USING (auth.uid() IS NOT NULL);

-- RLS Policies for revenue_transactions
CREATE POLICY "Users can view their own revenue transactions" ON public.revenue_transactions
FOR SELECT USING (auth.uid() = user_id OR auth.uid() = creator_id);

CREATE POLICY "System can insert revenue transactions" ON public.revenue_transactions
FOR INSERT WITH CHECK (true);

-- RLS Policies for marketplace_listings
CREATE POLICY "Marketplace listings are publicly viewable" ON public.marketplace_listings
FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their own listings" ON public.marketplace_listings
FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "Users can create listings for their redeemed rewards" ON public.marketplace_listings
FOR INSERT WITH CHECK (
  auth.uid() = seller_id AND
  EXISTS (
    SELECT 1 FROM public.reward_redemptions 
    WHERE id = reward_redemption_id AND user_id = auth.uid()
  )
);

-- RLS Policies for ai_tool_subscriptions
CREATE POLICY "Users can manage their own AI subscriptions" ON public.ai_tool_subscriptions
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for reward_redemption_codes
CREATE POLICY "Users can view codes for their own redemptions" ON public.reward_redemption_codes
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.reward_redemptions 
    WHERE id = redemption_id AND user_id = auth.uid()
  )
);

CREATE POLICY "System can manage redemption codes" ON public.reward_redemption_codes
FOR ALL WITH CHECK (true);

-- RLS Policies for creator_earnings
CREATE POLICY "Creators can view their own earnings" ON public.creator_earnings
FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "System can manage creator earnings" ON public.creator_earnings
FOR ALL WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_revenue_transactions_updated_at
    BEFORE UPDATE ON public.revenue_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_listings_updated_at
    BEFORE UPDATE ON public.marketplace_listings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_tool_subscriptions_updated_at
    BEFORE UPDATE ON public.ai_tool_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_creator_earnings_updated_at
    BEFORE UPDATE ON public.creator_earnings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique redemption codes
CREATE OR REPLACE FUNCTION public.generate_redemption_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  code TEXT;
  is_unique BOOLEAN := false;
BEGIN
  WHILE NOT is_unique LOOP
    -- Generate 8-character alphanumeric code
    code := upper(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT NOT EXISTS(
      SELECT 1 FROM public.reward_redemption_codes 
      WHERE redemption_code = code
    ) INTO is_unique;
  END LOOP;
  
  RETURN code;
END;
$$;

-- Function to handle reward purchase with revenue sharing
CREATE OR REPLACE FUNCTION public.purchase_reward_with_revenue_sharing(
  reward_id_param UUID,
  payment_method_param TEXT,
  total_amount_cents_param INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_uuid UUID;
  reward_record public.rewards;
  redemption_id UUID;
  revenue_settings_record public.revenue_settings;
  streamcentives_fee_cents INTEGER;
  creator_net_cents INTEGER;
  redemption_code TEXT;
BEGIN
  user_uuid := auth.uid();
  
  -- Get reward details
  SELECT * INTO reward_record
  FROM public.rewards
  WHERE id = reward_id_param AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Reward not found or inactive');
  END IF;
  
  -- Get marketplace fee settings
  SELECT * INTO revenue_settings_record
  FROM public.revenue_settings
  WHERE setting_name = 'marketplace_fee' AND is_active = true;
  
  streamcentives_fee_cents := FLOOR(total_amount_cents_param * revenue_settings_record.percentage / 100.0);
  creator_net_cents := total_amount_cents_param - streamcentives_fee_cents;
  
  -- Create reward redemption
  INSERT INTO public.reward_redemptions (
    reward_id, user_id, payment_method, amount_paid, status
  ) VALUES (
    reward_id_param, user_uuid, payment_method_param, 
    total_amount_cents_param::DECIMAL / 100.0, 'completed'
  ) RETURNING id INTO redemption_id;
  
  -- Generate redemption code
  redemption_code := public.generate_redemption_code();
  
  -- Create redemption code
  INSERT INTO public.reward_redemption_codes (redemption_id, redemption_code)
  VALUES (redemption_id, redemption_code);
  
  -- Record revenue transaction
  INSERT INTO public.revenue_transactions (
    transaction_type, user_id, creator_id, amount_total_cents, 
    streamcentives_fee_cents, net_amount_cents, status
  ) VALUES (
    'reward_purchase', user_uuid, reward_record.creator_id, 
    total_amount_cents_param, streamcentives_fee_cents, creator_net_cents, 'completed'
  );
  
  -- Add to creator earnings
  INSERT INTO public.creator_earnings (
    creator_id, earnings_type, amount_cents, source_transaction_id
  ) VALUES (
    reward_record.creator_id, 'reward_sale', creator_net_cents, redemption_id
  );
  
  -- Update reward redemption count
  UPDATE public.rewards
  SET quantity_redeemed = quantity_redeemed + 1
  WHERE id = reward_id_param;
  
  RETURN json_build_object(
    'success', true,
    'redemption_id', redemption_id,
    'redemption_code', redemption_code,
    'creator_earnings', creator_net_cents,
    'streamcentives_fee', streamcentives_fee_cents
  );
END;
$$;