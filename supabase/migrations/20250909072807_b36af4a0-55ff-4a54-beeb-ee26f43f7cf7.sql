-- Create messages table for the XP-based messaging system
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  xp_cost INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  sentiment_score DECIMAL(3,2),
  flagged_content BOOLEAN NOT NULL DEFAULT false,
  flagged_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  denied_at TIMESTAMP WITH TIME ZONE
);

-- Create message costs table for customizable XP pricing per creator
CREATE TABLE public.message_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL UNIQUE,
  xp_cost INTEGER NOT NULL DEFAULT 100,
  is_accepting_messages BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user XP balances table
CREATE TABLE public.user_xp_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_xp INTEGER NOT NULL DEFAULT 0,
  total_earned_xp INTEGER NOT NULL DEFAULT 0,
  total_spent_xp INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_xp_balances ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages
CREATE POLICY "Users can view messages they sent or received" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update message status" 
ON public.messages 
FOR UPDATE 
USING (auth.uid() = recipient_id);

-- RLS policies for message costs
CREATE POLICY "Creators can manage their message costs" 
ON public.message_costs 
FOR ALL 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can view message costs" 
ON public.message_costs 
FOR SELECT 
USING (true);

-- RLS policies for XP balances
CREATE POLICY "Users can view their own XP balance" 
ON public.user_xp_balances 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own XP balance" 
ON public.user_xp_balances 
FOR ALL 
USING (auth.uid() = user_id);

-- Create function to send message with XP deduction
CREATE OR REPLACE FUNCTION public.send_message_with_xp(
  recipient_id_param UUID,
  content_param TEXT,
  xp_cost_param INTEGER
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  sender_id UUID;
  sender_balance INTEGER;
  existing_pending_message UUID;
  new_message_id UUID;
BEGIN
  sender_id := auth.uid();
  
  -- Check if sender has already sent a pending message to this recipient
  SELECT id INTO existing_pending_message
  FROM public.messages
  WHERE sender_id = auth.uid() 
    AND recipient_id = recipient_id_param 
    AND status = 'pending'
  LIMIT 1;
  
  IF existing_pending_message IS NOT NULL THEN
    RAISE EXCEPTION 'You already have a pending message with this creator. Please wait for them to respond.';
  END IF;
  
  -- Get sender's current XP balance
  SELECT current_xp INTO sender_balance
  FROM public.user_xp_balances
  WHERE user_id = sender_id;
  
  -- If no XP record exists, create one with 0 balance
  IF sender_balance IS NULL THEN
    INSERT INTO public.user_xp_balances (user_id, current_xp)
    VALUES (sender_id, 0);
    sender_balance := 0;
  END IF;
  
  -- Check if sender has enough XP
  IF sender_balance < xp_cost_param THEN
    RAISE EXCEPTION 'Insufficient XP balance. You need % XP but only have %', xp_cost_param, sender_balance;
  END IF;
  
  -- Deduct XP from sender
  UPDATE public.user_xp_balances
  SET current_xp = current_xp - xp_cost_param,
      total_spent_xp = total_spent_xp + xp_cost_param,
      updated_at = now()
  WHERE user_id = sender_id;
  
  -- Create the message
  INSERT INTO public.messages (sender_id, recipient_id, content, xp_cost)
  VALUES (sender_id, recipient_id_param, content_param, xp_cost_param)
  RETURNING id INTO new_message_id;
  
  RETURN new_message_id;
END;
$$;

-- Create function to approve/deny messages
CREATE OR REPLACE FUNCTION public.update_message_status(
  message_id_param UUID,
  new_status_param TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  message_record public.messages;
BEGIN
  -- Get message and verify recipient
  SELECT * INTO message_record
  FROM public.messages
  WHERE id = message_id_param AND recipient_id = auth.uid();
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found or you are not authorized to update it';
  END IF;
  
  -- Validate status
  IF new_status_param NOT IN ('approved', 'denied') THEN
    RAISE EXCEPTION 'Invalid status. Must be approved or denied';
  END IF;
  
  -- Update message status
  UPDATE public.messages
  SET status = new_status_param,
      approved_at = CASE WHEN new_status_param = 'approved' THEN now() ELSE NULL END,
      denied_at = CASE WHEN new_status_param = 'denied' THEN now() ELSE NULL END,
      updated_at = now()
  WHERE id = message_id_param;
  
  RETURN TRUE;
END;
$$;

-- Add triggers for timestamp updates
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_costs_updated_at
  BEFORE UPDATE ON public.message_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_xp_balances_updated_at
  BEFORE UPDATE ON public.user_xp_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();