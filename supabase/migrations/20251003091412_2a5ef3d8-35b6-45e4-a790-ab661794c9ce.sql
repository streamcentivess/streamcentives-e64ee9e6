-- Create live_stream_chat table for real-time chat during streams
CREATE TABLE IF NOT EXISTS public.live_stream_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT chat_message_length CHECK (char_length(message) >= 1 AND char_length(message) <= 500)
);

-- Enable RLS
ALTER TABLE public.live_stream_chat ENABLE ROW LEVEL SECURITY;

-- Policies for live_stream_chat
CREATE POLICY "Anyone can view chat messages"
  ON public.live_stream_chat FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can send chat messages"
  ON public.live_stream_chat FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_live_stream_chat_stream_id ON public.live_stream_chat(stream_id);
CREATE INDEX idx_live_stream_chat_created_at ON public.live_stream_chat(created_at DESC);

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream_chat;