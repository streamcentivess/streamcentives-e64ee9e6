-- Add sponsor inbox functionality and offer responses

-- Create offer_responses table for threaded conversations around offers
CREATE TABLE public.offer_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.sponsor_offers(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('sponsor', 'creator')),
  response_type TEXT NOT NULL CHECK (response_type IN ('accept', 'decline', 'counter', 'message', 'negotiate')),
  message TEXT,
  counter_amount_cents INTEGER,
  counter_terms TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies for offer_responses
ALTER TABLE public.offer_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Offer participants can view responses" ON public.offer_responses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sponsor_offers so 
      WHERE so.id = offer_responses.offer_id 
      AND (so.sponsor_id = auth.uid() OR so.creator_id = auth.uid())
    )
  );

CREATE POLICY "Offer participants can create responses" ON public.offer_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sponsor_offers so 
      WHERE so.id = offer_responses.offer_id 
      AND (
        (so.sponsor_id = auth.uid() AND sender_type = 'sponsor') OR
        (so.creator_id = auth.uid() AND sender_type = 'creator')
      )
    ) AND sender_id = auth.uid()
  );

-- Add updated_at trigger
CREATE TRIGGER update_offer_responses_updated_at
  BEFORE UPDATE ON public.offer_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_offer_responses_offer_id ON public.offer_responses(offer_id);
CREATE INDEX idx_offer_responses_created_at ON public.offer_responses(created_at);

-- Update sponsor_offers table to track responses
ALTER TABLE public.sponsor_offers 
ADD COLUMN response_count INTEGER DEFAULT 0,
ADD COLUMN last_response_at TIMESTAMP WITH TIME ZONE;

-- Create function to update offer response count
CREATE OR REPLACE FUNCTION public.update_offer_response_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.sponsor_offers 
    SET 
      response_count = response_count + 1,
      last_response_at = NEW.created_at,
      status = CASE 
        WHEN NEW.response_type = 'accept' THEN 'accepted'
        WHEN NEW.response_type = 'decline' THEN 'declined'
        WHEN NEW.response_type IN ('counter', 'negotiate') THEN 'negotiating'
        ELSE status
      END
    WHERE id = NEW.offer_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.sponsor_offers 
    SET response_count = response_count - 1
    WHERE id = OLD.offer_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for response count
CREATE TRIGGER update_sponsor_offers_response_count
  AFTER INSERT OR DELETE ON public.offer_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_offer_response_count();

-- Allow sponsors to receive messages from creators
UPDATE public.profiles SET onboarding_completed = true WHERE user_id IN (
  SELECT user_id FROM public.sponsor_profiles
);

-- Add notification support for offer responses
CREATE OR REPLACE FUNCTION public.create_offer_response_notification()
RETURNS TRIGGER AS $$
DECLARE
  offer_record public.sponsor_offers;
  sender_name TEXT;
  recipient_id UUID;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get offer details
  SELECT * INTO offer_record FROM public.sponsor_offers WHERE id = NEW.offer_id;
  
  -- Get sender name
  SELECT COALESCE(display_name, username, 'Someone') INTO sender_name
  FROM public.profiles WHERE user_id = NEW.sender_id;
  
  -- Determine recipient (the other party in the offer)
  recipient_id := CASE 
    WHEN NEW.sender_type = 'creator' THEN offer_record.sponsor_id
    ELSE offer_record.creator_id
  END;
  
  -- Create appropriate notification based on response type
  CASE NEW.response_type
    WHEN 'accept' THEN
      notification_title := 'Offer Accepted!';
      notification_message := sender_name || ' accepted your partnership offer for "' || offer_record.offer_title || '"';
    WHEN 'decline' THEN
      notification_title := 'Offer Declined';
      notification_message := sender_name || ' declined your partnership offer for "' || offer_record.offer_title || '"';
    WHEN 'counter' THEN
      notification_title := 'Counter Offer Received';
      notification_message := sender_name || ' sent a counter offer for "' || offer_record.offer_title || '"';
    WHEN 'message' THEN
      notification_title := 'New Message on Offer';
      notification_message := sender_name || ' sent a message about "' || offer_record.offer_title || '"';
    WHEN 'negotiate' THEN
      notification_title := 'Negotiation Started';
      notification_message := sender_name || ' wants to negotiate the offer for "' || offer_record.offer_title || '"';
  END CASE;
  
  -- Create notification
  INSERT INTO public.notifications (
    user_id, type, title, message, data, priority
  ) VALUES (
    recipient_id,
    'offer_response',
    notification_title,
    notification_message,
    jsonb_build_object(
      'offer_id', NEW.offer_id,
      'response_id', NEW.id,
      'response_type', NEW.response_type,
      'sender_id', NEW.sender_id,
      'sender_name', sender_name
    ),
    'high'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for offer response notifications
CREATE TRIGGER create_offer_response_notification_trigger
  AFTER INSERT ON public.offer_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.create_offer_response_notification();

-- Add realtime for offer responses
ALTER PUBLICATION supabase_realtime ADD TABLE public.offer_responses;