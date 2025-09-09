-- Give 250 XP to all existing users
INSERT INTO public.user_xp_balances (user_id, current_xp, total_earned_xp)
SELECT 
  p.user_id,
  250,
  250
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_xp_balances uxb 
  WHERE uxb.user_id = p.user_id
);

-- Update existing XP balances to add 250 XP (one-time bonus)
UPDATE public.user_xp_balances
SET 
  current_xp = current_xp + 250,
  total_earned_xp = total_earned_xp + 250,
  updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM public.profiles p 
  WHERE p.user_id = user_xp_balances.user_id
);