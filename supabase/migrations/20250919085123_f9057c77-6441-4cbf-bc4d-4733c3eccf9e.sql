-- Enhanced Transaction Ledger System
CREATE TYPE transaction_type AS ENUM (
    'XP_PURCHASE_FAN_SHARE',      -- XP bought by fan, 80% for fan
    'XP_PURCHASE_PLATFORM_SHARE', -- XP bought by fan, 20% for platform
    'MARKETPLACE_SALE_XP',        -- P2P sale paid in XP
    'MARKETPLACE_FEE_XP',         -- 2% platform fee on P2P sale, paid in XP
    'CREATOR_CASH_OUT_REQUEST',   -- Creator requests to convert XP to fiat
    'CREATOR_CASH_OUT_PAYOUT',    -- Actual fiat payout
    'CASH_OUT_FEE_FIAT',          -- 2% platform fee on cash out, paid in fiat
    'SPONSOR_PAYMENT_FIAT',       -- Sponsor payment for deal, in fiat
    'BRAND_DEAL_FEE_FIAT',        -- 2% platform fee on sponsor payment, in fiat
    'SUBSCRIPTION_FEE_FIAT',      -- Creator subscription, in fiat
    'REWARD_SALE_XP',             -- Reward sold for XP
    'TIP_PAYMENT_XP'              -- Tip paid in XP
);

-- Master transaction ledger for all XP and fiat movements
CREATE TABLE public.transactions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    related_user_id UUID,
    amount_value BIGINT NOT NULL,
    currency_type TEXT NOT NULL CHECK (currency_type IN ('XP', 'FIAT')),
    type transaction_type NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    stripe_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- XP conversion rates for dynamic pricing
CREATE TABLE public.xp_conversion_rates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    xp_per_dollar_cents INTEGER NOT NULL DEFAULT 100, -- 100 XP = $1.00
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default conversion rate
INSERT INTO public.xp_conversion_rates (xp_per_dollar_cents, is_active) VALUES (100, true);

-- Enhanced fulfillments table for physical rewards
CREATE TABLE public.fulfillments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reward_redemption_id UUID NOT NULL,
    creator_id UUID NOT NULL,
    fan_id UUID NOT NULL,
    shipping_address JSONB NOT NULL,
    tracking_number TEXT,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Experiential rewards table
CREATE TABLE public.experiences (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    reward_redemption_id UUID NOT NULL,
    creator_id UUID NOT NULL,
    fan_id UUID NOT NULL,
    experience_type TEXT NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    location TEXT,
    verification_code TEXT UNIQUE,
    qr_code_url TEXT,
    instructions TEXT,
    status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'confirmed', 'completed', 'cancelled')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enhanced payouts table for creator cash-outs
CREATE TABLE public.creator_payouts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID NOT NULL,
    xp_amount BIGINT NOT NULL,
    fiat_amount_cents INTEGER NOT NULL,
    fee_amount_cents INTEGER NOT NULL,
    net_amount_cents INTEGER NOT NULL,
    conversion_rate INTEGER NOT NULL, -- XP per dollar at time of payout
    stripe_payout_id TEXT,
    bank_account_last4 TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_conversion_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fulfillments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = related_user_id);

CREATE POLICY "System can manage all transactions" 
ON public.transactions 
FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS Policies for XP conversion rates
CREATE POLICY "Anyone can view active conversion rates" 
ON public.xp_conversion_rates 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "System can manage conversion rates" 
ON public.xp_conversion_rates 
FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS Policies for fulfillments
CREATE POLICY "Creators can manage their fulfillments" 
ON public.fulfillments 
FOR ALL 
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Fans can view their own fulfillments" 
ON public.fulfillments 
FOR SELECT 
USING (auth.uid() = fan_id);

-- RLS Policies for experiences
CREATE POLICY "Creators can manage their experiences" 
ON public.experiences 
FOR ALL 
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Fans can view their own experiences" 
ON public.experiences 
FOR SELECT 
USING (auth.uid() = fan_id);

CREATE POLICY "Fans can update experience status" 
ON public.experiences 
FOR UPDATE 
USING (auth.uid() = fan_id);

-- RLS Policies for creator payouts
CREATE POLICY "Creators can view their own payouts" 
ON public.creator_payouts 
FOR SELECT 
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can create payout requests" 
ON public.creator_payouts 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "System can manage all payouts" 
ON public.creator_payouts 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_related_user_id ON public.transactions(related_user_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX idx_fulfillments_creator_id ON public.fulfillments(creator_id);
CREATE INDEX idx_fulfillments_fan_id ON public.fulfillments(fan_id);
CREATE INDEX idx_experiences_creator_id ON public.experiences(creator_id);
CREATE INDEX idx_experiences_fan_id ON public.experiences(fan_id);
CREATE INDEX idx_creator_payouts_creator_id ON public.creator_payouts(creator_id);

-- Function to generate unique verification codes
CREATE OR REPLACE FUNCTION public.generate_verification_code()
RETURNS TEXT AS $$
DECLARE
    code TEXT;
    is_unique BOOLEAN := false;
BEGIN
    WHILE NOT is_unique LOOP
        code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 12));
        SELECT NOT EXISTS(
            SELECT 1 FROM public.experiences WHERE verification_code = code
        ) INTO is_unique;
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;