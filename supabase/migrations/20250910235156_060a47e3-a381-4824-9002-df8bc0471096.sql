-- Allow users to delete messages they sent
CREATE POLICY "Users can delete messages they sent" 
ON public.messages 
FOR DELETE 
USING (auth.uid() = sender_id);

-- Allow users to delete messages they received  
CREATE POLICY "Users can delete messages they received" 
ON public.messages 
FOR DELETE 
USING (auth.uid() = recipient_id);