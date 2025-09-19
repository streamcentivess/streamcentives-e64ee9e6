-- Fix security issues from the previous migration

-- Fix search path for the functions by explicitly setting them
DROP FUNCTION IF EXISTS public.get_user_strike_count(UUID);
DROP FUNCTION IF EXISTS public.is_user_restricted(UUID);

-- Recreate functions with explicit search path
CREATE OR REPLACE FUNCTION public.get_user_strike_count(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  total_strikes INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(strike_count), 0) INTO total_strikes
  FROM public.user_moderation_history
  WHERE user_id = target_user_id
    AND (strike_expires_at IS NULL OR strike_expires_at > now());
  
  RETURN total_strikes;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_user_restricted(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  is_restricted BOOLEAN := false;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.user_moderation_history
    WHERE user_id = target_user_id
      AND (
        (is_shadow_banned = true AND (shadow_ban_expires_at IS NULL OR shadow_ban_expires_at > now()))
        OR
        (is_restricted = true AND (restriction_expires_at IS NULL OR restriction_expires_at > now()))
      )
  ) INTO is_restricted;
  
  RETURN is_restricted;
END;
$$;