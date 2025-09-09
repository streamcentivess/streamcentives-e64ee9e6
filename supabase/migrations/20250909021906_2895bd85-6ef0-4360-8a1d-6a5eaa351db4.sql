-- Create rewards table for creators to manage their rewards
CREATE TABLE public.rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('merchandise', 'experience', 'digital', 'access')),
  xp_cost INTEGER,
  cash_price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  quantity_available INTEGER NOT NULL DEFAULT 0,
  quantity_redeemed INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  tags TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Creators can manage their own rewards
CREATE POLICY "Creators can manage their own rewards"
ON public.rewards
FOR ALL
USING (auth.uid() = creator_id);

-- Everyone can view active rewards
CREATE POLICY "Users can view active rewards"
ON public.rewards
FOR SELECT
USING (is_active = true);

-- Create redemptions table to track reward redemptions
CREATE TABLE public.reward_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('xp', 'cash')),
  amount_paid DECIMAL(10,2),
  xp_spent INTEGER,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on redemptions
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own redemptions
CREATE POLICY "Users can view their own redemptions"
ON public.reward_redemptions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own redemptions
CREATE POLICY "Users can create their own redemptions"
ON public.reward_redemptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Creators can view redemptions for their rewards
CREATE POLICY "Creators can view redemptions for their rewards"
ON public.reward_redemptions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rewards r 
    WHERE r.id = reward_id AND r.creator_id = auth.uid()
  )
);

-- Add trigger for updated_at on rewards
CREATE TRIGGER update_rewards_updated_at
BEFORE UPDATE ON public.rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on reward_redemptions
CREATE TRIGGER update_reward_redemptions_updated_at
BEFORE UPDATE ON public.reward_redemptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle reward redemption
CREATE OR REPLACE FUNCTION public.redeem_reward(
  reward_id_param UUID,
  payment_method_param TEXT,
  xp_spent_param INTEGER DEFAULT NULL,
  amount_paid_param DECIMAL DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reward_record public.rewards;
  redemption_id UUID;
BEGIN
  -- Get reward details and lock row
  SELECT * INTO reward_record
  FROM public.rewards
  WHERE id = reward_id_param AND is_active = true
  FOR UPDATE;
  
  -- Check if reward exists and is available
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Reward not found or not active';
  END IF;
  
  -- Check if quantity is available
  IF reward_record.quantity_available <= reward_record.quantity_redeemed THEN
    RAISE EXCEPTION 'Reward is out of stock';
  END IF;
  
  -- Validate payment method
  IF payment_method_param = 'xp' THEN
    IF reward_record.xp_cost IS NULL OR xp_spent_param IS NULL THEN
      RAISE EXCEPTION 'XP cost not available for this reward';
    END IF;
    IF xp_spent_param < reward_record.xp_cost THEN
      RAISE EXCEPTION 'Insufficient XP provided';
    END IF;
  ELSIF payment_method_param = 'cash' THEN
    IF reward_record.cash_price IS NULL OR amount_paid_param IS NULL THEN
      RAISE EXCEPTION 'Cash price not available for this reward';
    END IF;
    IF amount_paid_param < reward_record.cash_price THEN
      RAISE EXCEPTION 'Insufficient payment amount';
    END IF;
  END IF;
  
  -- Create redemption record
  INSERT INTO public.reward_redemptions (
    reward_id,
    user_id,
    payment_method,
    amount_paid,
    xp_spent,
    status
  ) VALUES (
    reward_id_param,
    auth.uid(),
    payment_method_param,
    amount_paid_param,
    xp_spent_param,
    'completed'
  ) RETURNING id INTO redemption_id;
  
  -- Update reward redemption count
  UPDATE public.rewards
  SET quantity_redeemed = quantity_redeemed + 1
  WHERE id = reward_id_param;
  
  RETURN redemption_id;
END;
$$;