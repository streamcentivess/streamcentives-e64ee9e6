-- Create sponsor profiles table
CREATE TABLE public.sponsor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  industry TEXT,
  website_url TEXT,
  company_logo_url TEXT,
  company_description TEXT,
  verified BOOLEAN DEFAULT false,
  budget_range_min INTEGER,
  budget_range_max INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sponsor offers table
CREATE TABLE public.sponsor_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sponsor_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  offer_title TEXT NOT NULL,
  offer_description TEXT NOT NULL,
  offer_amount_cents INTEGER NOT NULL,
  campaign_duration_days INTEGER,
  deliverables JSONB DEFAULT '[]'::jsonb,
  terms TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'negotiating', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create offer negotiations table
CREATE TABLE public.offer_negotiations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('sponsor', 'creator')),
  message TEXT NOT NULL,
  proposed_amount_cents INTEGER,
  proposed_terms JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create escrow payments table
CREATE TABLE public.escrow_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id UUID NOT NULL,
  sponsor_id UUID NOT NULL,
  creator_id UUID NOT NULL,
  amount_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded')),
  stripe_payment_intent_id TEXT,
  held_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  released_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  auto_refund_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post tags table for creator tagging
CREATE TABLE public.post_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  tagged_user_id UUID NOT NULL,
  tagged_by_user_id UUID NOT NULL,
  tag_type TEXT DEFAULT 'creator' CHECK (tag_type IN ('creator', 'sponsor', 'user')),
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sponsor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsor_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offer_negotiations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sponsor_profiles
CREATE POLICY "Sponsors can manage their own profile"
ON public.sponsor_profiles
FOR ALL
USING (auth.uid() = user_id);

CREATE POLICY "Public can view verified sponsor profiles"
ON public.sponsor_profiles
FOR SELECT
USING (verified = true);

-- RLS Policies for sponsor_offers
CREATE POLICY "Sponsors can manage their offers"
ON public.sponsor_offers
FOR ALL
USING (auth.uid() = sponsor_id);

CREATE POLICY "Creators can view and respond to offers sent to them"
ON public.sponsor_offers
FOR SELECT
USING (auth.uid() = creator_id);

CREATE POLICY "Creators can update offers sent to them"
ON public.sponsor_offers
FOR UPDATE
USING (auth.uid() = creator_id);

-- RLS Policies for offer_negotiations
CREATE POLICY "Offer participants can view negotiations"
ON public.offer_negotiations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sponsor_offers so
    WHERE so.id = offer_negotiations.offer_id
    AND (so.sponsor_id = auth.uid() OR so.creator_id = auth.uid())
  )
);

CREATE POLICY "Offer participants can create negotiations"
ON public.offer_negotiations
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.sponsor_offers so
    WHERE so.id = offer_id
    AND (so.sponsor_id = auth.uid() OR so.creator_id = auth.uid())
  )
);

-- RLS Policies for escrow_payments
CREATE POLICY "System can manage escrow payments"
ON public.escrow_payments
FOR ALL
USING (true);

CREATE POLICY "Participants can view their escrow payments"
ON public.escrow_payments
FOR SELECT
USING (auth.uid() = sponsor_id OR auth.uid() = creator_id);

-- RLS Policies for post_tags
CREATE POLICY "Users can view post tags"
ON public.post_tags
FOR SELECT
USING (true);

CREATE POLICY "Users can create post tags"
ON public.post_tags
FOR INSERT
WITH CHECK (auth.uid() = tagged_by_user_id);

CREATE POLICY "Tagged users can update approval status"
ON public.post_tags
FOR UPDATE
USING (auth.uid() = tagged_user_id);

-- Create indexes for better performance
CREATE INDEX idx_sponsor_profiles_user_id ON public.sponsor_profiles(user_id);
CREATE INDEX idx_sponsor_offers_sponsor_id ON public.sponsor_offers(sponsor_id);
CREATE INDEX idx_sponsor_offers_creator_id ON public.sponsor_offers(creator_id);
CREATE INDEX idx_sponsor_offers_status ON public.sponsor_offers(status);
CREATE INDEX idx_offer_negotiations_offer_id ON public.offer_negotiations(offer_id);
CREATE INDEX idx_escrow_payments_offer_id ON public.escrow_payments(offer_id);
CREATE INDEX idx_escrow_payments_status ON public.escrow_payments(status);
CREATE INDEX idx_post_tags_post_id ON public.post_tags(post_id);
CREATE INDEX idx_post_tags_tagged_user_id ON public.post_tags(tagged_user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_sponsor_profiles_updated_at
  BEFORE UPDATE ON public.sponsor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sponsor_offers_updated_at
  BEFORE UPDATE ON public.sponsor_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_escrow_payments_updated_at
  BEFORE UPDATE ON public.escrow_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();