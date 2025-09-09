-- Allow users to view other users' XP balances (read-only)
DROP POLICY IF EXISTS "Users can view their own XP balance" ON public.user_xp_balances;

-- Create new policies for XP balances
CREATE POLICY "Users can view all XP balances" 
ON public.user_xp_balances 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own XP balance" 
ON public.user_xp_balances 
FOR ALL 
USING (auth.uid() = user_id);

-- Enable realtime for user_xp_balances table
ALTER TABLE public.user_xp_balances REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_xp_balances;