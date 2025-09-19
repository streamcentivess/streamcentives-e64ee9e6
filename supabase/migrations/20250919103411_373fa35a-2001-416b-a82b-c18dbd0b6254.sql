-- Add Stripe Connect account ID to profiles for creator payouts
ALTER TABLE public.profiles 
ADD COLUMN stripe_connect_account_id TEXT DEFAULT NULL;

-- Add index for faster lookups
CREATE INDEX idx_profiles_stripe_connect_account_id 
ON public.profiles(stripe_connect_account_id) 
WHERE stripe_connect_account_id IS NOT NULL;