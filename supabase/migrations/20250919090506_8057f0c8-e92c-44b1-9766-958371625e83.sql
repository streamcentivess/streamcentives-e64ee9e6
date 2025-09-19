-- Add Creator Pro subscription columns to profiles table (only if they don't exist)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_tier') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_status TEXT DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT UNIQUE DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'stripe_subscription_id') THEN
        ALTER TABLE public.profiles ADD COLUMN stripe_subscription_id TEXT UNIQUE DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_started_at') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_started_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'subscription_expires_at') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
    END IF;
END $$;

-- Create brand_deals table for sponsor payment system (only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.brand_deals (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    creator_id UUID NOT NULL,
    sponsor_id UUID NOT NULL,
    offer_id UUID REFERENCES public.sponsor_offers(id),
    deal_name TEXT NOT NULL,
    offer_details TEXT,
    amount_cents INTEGER NOT NULL,
    streamcentives_fee_cents INTEGER NOT NULL DEFAULT 0,
    creator_net_cents INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending',
    stripe_payment_intent_id TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on brand_deals
ALTER TABLE public.brand_deals ENABLE ROW LEVEL SECURITY;

-- RLS policies for brand_deals
DROP POLICY IF EXISTS "Creators can view their brand deals" ON public.brand_deals;
CREATE POLICY "Creators can view their brand deals" 
ON public.brand_deals 
FOR SELECT 
USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Sponsors can view their brand deals" ON public.brand_deals;
CREATE POLICY "Sponsors can view their brand deals" 
ON public.brand_deals 
FOR SELECT 
USING (auth.uid() = sponsor_id);

DROP POLICY IF EXISTS "Sponsors can create brand deals" ON public.brand_deals;
CREATE POLICY "Sponsors can create brand deals" 
ON public.brand_deals 
FOR INSERT 
WITH CHECK (auth.uid() = sponsor_id);

DROP POLICY IF EXISTS "Participants can update brand deals" ON public.brand_deals;
CREATE POLICY "Participants can update brand deals" 
ON public.brand_deals 
FOR UPDATE 
USING (auth.uid() = creator_id OR auth.uid() = sponsor_id);

-- Create function to handle subscription status updates
CREATE OR REPLACE FUNCTION public.update_creator_subscription_status(
    user_id_param UUID,
    status_param TEXT,
    tier_param TEXT DEFAULT 'free',
    stripe_customer_id_param TEXT DEFAULT NULL,
    stripe_subscription_id_param TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles
    SET 
        subscription_status = status_param,
        subscription_tier = tier_param,
        stripe_customer_id = COALESCE(stripe_customer_id_param, stripe_customer_id),
        stripe_subscription_id = COALESCE(stripe_subscription_id_param, stripe_subscription_id),
        subscription_started_at = CASE 
            WHEN status_param = 'active' AND subscription_status != 'active' THEN now()
            ELSE subscription_started_at
        END,
        updated_at = now()
    WHERE user_id = user_id_param;
    
    RETURN json_build_object(
        'success', true,
        'user_id', user_id_param,
        'status', status_param,
        'tier', tier_param
    );
END;
$$;

-- Create function to process brand deal payments
CREATE OR REPLACE FUNCTION public.process_brand_deal_payment(
    deal_id_param UUID,
    payment_intent_id_param TEXT,
    amount_paid_cents_param INTEGER
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    deal_record public.brand_deals;
    streamcentives_fee INTEGER;
    creator_net INTEGER;
BEGIN
    -- Get and lock the deal
    SELECT * INTO deal_record
    FROM public.brand_deals
    WHERE id = deal_id_param 
        AND status = 'accepted'
    FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN json_build_object('success', false, 'error', 'Deal not found or not accepted');
    END IF;
    
    -- Calculate fees (2% platform fee)
    streamcentives_fee := FLOOR(amount_paid_cents_param * 0.02);
    creator_net := amount_paid_cents_param - streamcentives_fee;
    
    -- Update deal status
    UPDATE public.brand_deals
    SET 
        status = 'paid',
        stripe_payment_intent_id = payment_intent_id_param,
        streamcentives_fee_cents = streamcentives_fee,
        creator_net_cents = creator_net,
        paid_at = now(),
        updated_at = now()
    WHERE id = deal_id_param;
    
    -- Log transactions
    INSERT INTO public.transactions (
        user_id, related_user_id, amount_value, currency_type, type, status,
        stripe_id, metadata
    ) VALUES (
        deal_record.sponsor_id, deal_record.creator_id, amount_paid_cents_param, 'FIAT',
        'SPONSOR_PAYMENT_FIAT', 'completed', payment_intent_id_param,
        jsonb_build_object('deal_id', deal_id_param, 'creator_net', creator_net, 'platform_fee', streamcentives_fee)
    );
    
    -- Log platform fee
    INSERT INTO public.transactions (
        user_id, related_user_id, amount_value, currency_type, type, status,
        metadata
    ) VALUES (
        'platform', deal_record.sponsor_id, streamcentives_fee, 'FIAT',
        'BRAND_DEAL_FEE_FIAT', 'completed',
        jsonb_build_object('deal_id', deal_id_param, 'original_amount', amount_paid_cents_param)
    );
    
    -- Add creator earnings
    INSERT INTO public.creator_earnings (
        creator_id, earnings_type, amount_cents, net_amount_cents,
        transaction_reference, fee_breakdown
    ) VALUES (
        deal_record.creator_id, 'brand_deal', creator_net, creator_net,
        deal_id_param, jsonb_build_object('streamcentives_fee', streamcentives_fee)
    );
    
    RETURN json_build_object(
        'success', true,
        'deal_id', deal_id_param,
        'creator_net', creator_net,
        'platform_fee', streamcentives_fee
    );
END;
$$;