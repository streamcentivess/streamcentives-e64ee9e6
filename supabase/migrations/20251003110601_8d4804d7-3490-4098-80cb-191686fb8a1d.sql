-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.send_message_with_xp(uuid, text, integer);

-- Create function to send messages with XP cost
CREATE OR REPLACE FUNCTION public.send_message_with_xp(
  recipient_id_param uuid,
  content_param text,
  xp_cost_param integer DEFAULT 0
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_user_id uuid;
  message_id uuid;
BEGIN
  -- Get the authenticated user
  sender_user_id := auth.uid();
  
  IF sender_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Don't allow sending messages to yourself
  IF sender_user_id = recipient_id_param THEN
    RETURN json_build_object('success', false, 'error', 'Cannot send message to yourself');
  END IF;
  
  -- If XP cost > 0, check and deduct XP
  IF xp_cost_param > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_xp_balances 
      WHERE user_id = sender_user_id 
        AND current_xp >= xp_cost_param
    ) THEN
      RETURN json_build_object('success', false, 'error', 'Insufficient XP balance');
    END IF;
    
    -- Deduct XP from sender
    UPDATE user_xp_balances
    SET current_xp = current_xp - xp_cost_param,
        total_spent_xp = COALESCE(total_spent_xp, 0) + xp_cost_param,
        updated_at = now()
    WHERE user_id = sender_user_id;
  END IF;
  
  -- Insert message
  INSERT INTO messages (
    sender_id, recipient_id, content, xp_cost
  ) VALUES (
    sender_user_id, recipient_id_param, content_param, xp_cost_param
  ) RETURNING id INTO message_id;
  
  RETURN json_build_object(
    'success', true,
    'message_id', message_id,
    'xp_cost', xp_cost_param
  );
END;
$$;