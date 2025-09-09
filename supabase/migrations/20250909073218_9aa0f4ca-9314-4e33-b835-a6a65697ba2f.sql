-- Create table to store AI sentiment analysis results
CREATE TABLE public.message_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  is_appropriate BOOLEAN NOT NULL DEFAULT true,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high')),
  flags TEXT[] DEFAULT '{}',
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.message_analysis ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_analysis
CREATE POLICY "Users can view analysis of their own messages" 
ON public.message_analysis 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.messages 
    WHERE messages.id = message_analysis.message_id 
    AND (messages.sender_id = auth.uid() OR messages.recipient_id = auth.uid())
  )
);

-- Only the system can insert analysis results (via edge functions)
CREATE POLICY "System can insert analysis results" 
ON public.message_analysis 
FOR INSERT 
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX idx_message_analysis_message_id ON public.message_analysis(message_id);
CREATE INDEX idx_message_analysis_is_appropriate ON public.message_analysis(is_appropriate);
CREATE INDEX idx_message_analysis_severity ON public.message_analysis(severity);

-- Add a status column to messages table to track analysis
ALTER TABLE public.messages 
ADD COLUMN analysis_status TEXT DEFAULT 'pending' CHECK (analysis_status IN ('pending', 'analyzing', 'completed', 'failed'));

-- Create index on analysis_status
CREATE INDEX idx_messages_analysis_status ON public.messages(analysis_status);