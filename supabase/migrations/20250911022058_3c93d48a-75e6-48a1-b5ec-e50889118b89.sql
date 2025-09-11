-- Create campaign merchandise table to store merch details for campaigns
CREATE TABLE public.campaign_merchandise (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_image_url TEXT,
  price_cents INTEGER NOT NULL, -- Price in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  external_product_url TEXT, -- Link to external store
  discount_code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create campaign purchases table to track fan purchases
CREATE TABLE public.campaign_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  merchandise_id UUID NOT NULL REFERENCES public.campaign_merchandise(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  stripe_session_id TEXT UNIQUE,
  amount_paid_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  purchase_status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  proof_of_purchase_url TEXT, -- For external purchases
  xp_earned INTEGER DEFAULT 0,
  purchased_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.campaign_merchandise ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_purchases ENABLE ROW LEVEL SECURITY;

-- Policies for campaign_merchandise
CREATE POLICY "Everyone can view active merchandise" ON public.campaign_merchandise
  FOR SELECT USING (is_active = true);

CREATE POLICY "Creators can manage their campaign merchandise" ON public.campaign_merchandise
  FOR ALL USING (auth.uid() = creator_id);

-- Policies for campaign_purchases  
CREATE POLICY "Users can view their own purchases" ON public.campaign_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own purchases" ON public.campaign_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchases" ON public.campaign_purchases
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Creators can view purchases for their campaigns" ON public.campaign_purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.campaigns c 
      WHERE c.id = campaign_purchases.campaign_id 
      AND c.creator_id = auth.uid()
    )
  );

-- Create triggers for updated_at
CREATE TRIGGER update_campaign_merchandise_updated_at
  BEFORE UPDATE ON public.campaign_merchandise
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_purchases_updated_at
  BEFORE UPDATE ON public.campaign_purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update campaign progress when purchase is completed
CREATE OR REPLACE FUNCTION public.handle_campaign_purchase_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to completed
  IF NEW.purchase_status = 'completed' AND OLD.purchase_status != 'completed' THEN
    -- Update campaign progress (increment by 1 for each purchase)
    UPDATE public.campaigns
    SET current_progress = current_progress + 1,
        updated_at = now()
    WHERE id = NEW.campaign_id;
    
    -- Award XP to user if campaign has XP rewards
    DECLARE 
      campaign_xp INTEGER;
    BEGIN
      SELECT xp_reward INTO campaign_xp
      FROM public.campaigns
      WHERE id = NEW.campaign_id;
      
      IF campaign_xp > 0 THEN
        -- Update user's XP balance
        INSERT INTO public.user_xp_balances (user_id, current_xp, total_earned_xp)
        VALUES (NEW.user_id, campaign_xp, campaign_xp)
        ON CONFLICT (user_id)
        DO UPDATE SET 
          current_xp = user_xp_balances.current_xp + campaign_xp,
          total_earned_xp = user_xp_balances.total_earned_xp + campaign_xp,
          updated_at = now();
          
        -- Update the purchase record with XP earned
        NEW.xp_earned = campaign_xp;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;