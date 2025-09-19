-- Add offer receiving rate to profiles table
ALTER TABLE public.profiles 
ADD COLUMN offer_receiving_rate_cents INTEGER DEFAULT 500;

-- Add comment to explain the field
COMMENT ON COLUMN public.profiles.offer_receiving_rate_cents IS 'Amount creators charge sponsors to receive offers (in cents, default $5.00)';