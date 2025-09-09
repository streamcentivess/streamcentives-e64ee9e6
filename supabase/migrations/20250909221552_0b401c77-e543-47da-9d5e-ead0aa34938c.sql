-- Add conversation threading support to messages table
ALTER TABLE public.messages 
ADD COLUMN parent_message_id UUID REFERENCES public.messages(id),
ADD COLUMN conversation_id UUID DEFAULT gen_random_uuid();

-- Update existing messages to have conversation_id
UPDATE public.messages 
SET conversation_id = gen_random_uuid() 
WHERE conversation_id IS NULL;

-- Create index for better performance on conversation queries
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_parent_message_id ON public.messages(parent_message_id);

-- Create a view to get conversation participants
CREATE OR REPLACE VIEW conversation_participants AS
SELECT DISTINCT 
    conversation_id,
    CASE 
        WHEN sender_id < recipient_id THEN sender_id 
        ELSE recipient_id 
    END as user1_id,
    CASE 
        WHEN sender_id < recipient_id THEN recipient_id 
        ELSE sender_id 
    END as user2_id
FROM public.messages;