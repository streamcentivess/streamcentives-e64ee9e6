-- First, let's add delivery_type and instant_delivery fields to rewards table if they don't exist
ALTER TABLE public.rewards 
ADD COLUMN IF NOT EXISTS delivery_type TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS instant_delivery BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS creator_xp_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS external_url TEXT;

-- Add marketplace transaction tracking for better revenue sharing
CREATE TABLE IF NOT EXISTS public.marketplace_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  total_amount_cents INTEGER NOT NULL,
  buyer_fee_cents INTEGER NOT NULL DEFAULT 0,
  seller_fee_cents INTEGER NOT NULL DEFAULT 0,
  streamcentives_fee_cents INTEGER NOT NULL DEFAULT 0,
  creator_royalty_cents INTEGER NOT NULL DEFAULT 0,
  net_seller_amount_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on marketplace_transactions
ALTER TABLE public.marketplace_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for marketplace_transactions
CREATE POLICY "Users can view their marketplace transactions" ON public.marketplace_transactions
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "System can manage marketplace transactions" ON public.marketplace_transactions
  FOR ALL USING (true) WITH CHECK (true);

-- Add instant redemption tracking
CREATE TABLE IF NOT EXISTS public.instant_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  redemption_id UUID REFERENCES public.reward_redemptions(id) ON DELETE CASCADE,
  redemption_type TEXT NOT NULL, -- 'follow', 'code', 'external_redirect'
  redemption_data JSONB, -- store follow confirmation, code, redirect URL, etc.
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on instant_redemptions
ALTER TABLE public.instant_redemptions ENABLE ROW LEVEL SECURITY;

-- Create policies for instant_redemptions
CREATE POLICY "Users can view their instant redemptions" ON public.instant_redemptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.reward_redemptions rr
      WHERE rr.id = instant_redemptions.redemption_id 
      AND rr.user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage instant redemptions" ON public.instant_redemptions
  FOR ALL USING (true) WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE TRIGGER update_marketplace_transactions_updated_at
  BEFORE UPDATE ON public.marketplace_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_instant_redemptions_updated_at
  BEFORE UPDATE ON public.instant_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();