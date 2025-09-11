-- Update RLS policies for rewards to ensure all active rewards are visible
DROP POLICY IF EXISTS "Users can view active rewards" ON public.rewards;

-- Create a more permissive policy for viewing rewards
CREATE POLICY "All users can view active rewards" 
ON public.rewards 
FOR SELECT 
USING (is_active = true);

-- Ensure the rewards table has proper realtime enabled
ALTER TABLE public.rewards REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.rewards;