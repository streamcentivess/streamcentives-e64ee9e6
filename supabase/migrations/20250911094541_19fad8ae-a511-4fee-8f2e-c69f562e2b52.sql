-- Create purchase history table for XP purchases
CREATE TABLE public.xp_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_session_id TEXT UNIQUE NOT NULL,
  amount_paid_cents INTEGER NOT NULL,
  xp_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_price_id TEXT NOT NULL,
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.xp_purchases ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own purchase history
CREATE POLICY "Users can view their own purchase history"
ON public.xp_purchases
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy for edge functions to insert purchase records
CREATE POLICY "Edge functions can insert purchase records"
ON public.xp_purchases
FOR INSERT
WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_xp_purchases_updated_at
BEFORE UPDATE ON public.xp_purchases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();