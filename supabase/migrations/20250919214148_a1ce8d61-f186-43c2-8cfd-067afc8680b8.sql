-- Create community_messages table for real-time chat
CREATE TABLE public.community_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Community members can view messages" 
ON public.community_messages 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.community_members cm 
    WHERE cm.community_id = community_messages.community_id 
    AND cm.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.communities c 
    WHERE c.id = community_messages.community_id 
    AND c.is_public = true
  )
);

CREATE POLICY "Community members can create messages" 
ON public.community_messages 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1 FROM public.community_members cm 
      WHERE cm.community_id = community_messages.community_id 
      AND cm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.communities c 
      WHERE c.id = community_messages.community_id 
      AND c.is_public = true
    )
  )
);

CREATE POLICY "Users can update their own messages" 
ON public.community_messages 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages" 
ON public.community_messages 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_community_messages_community_id ON public.community_messages(community_id);
CREATE INDEX idx_community_messages_created_at ON public.community_messages(created_at);

-- Enable real-time for the table
ALTER TABLE public.community_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;