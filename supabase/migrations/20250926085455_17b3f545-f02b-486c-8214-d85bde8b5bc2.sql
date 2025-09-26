-- Fix the send_message_with_xp function to only handle XP deduction for existing messages
CREATE OR REPLACE FUNCTION public.send_message_with_xp(recipient_id_param uuid, content_param text, xp_cost_param integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  sender_user_id UUID;
  sender_balance INTEGER;
  new_message_id UUID;
BEGIN
  sender_user_id := auth.uid();
  
  -- Get sender's current XP balance
  SELECT current_xp INTO sender_balance
  FROM public.user_xp_balances
  WHERE user_id = sender_user_id;
  
  -- If no XP record exists, create one with 0 balance
  IF sender_balance IS NULL THEN
    INSERT INTO public.user_xp_balances (user_id, current_xp)
    VALUES (sender_user_id, 0);
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
  WHERE user_id = sender_user_id;
  
  -- Create the message
  INSERT INTO public.messages (sender_id, recipient_id, content, xp_cost)
  VALUES (sender_user_id, recipient_id_param, content_param, xp_cost_param)
  RETURNING id INTO new_message_id;
  
  RETURN new_message_id;
END;
$function$;