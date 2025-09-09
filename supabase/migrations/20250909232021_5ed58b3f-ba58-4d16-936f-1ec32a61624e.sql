-- Create reposts table for user reposts/shares
CREATE TABLE IF NOT EXISTS public.reposts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  post_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- Enable RLS
ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

-- Create policies for reposts
CREATE POLICY "Users can create their own reposts" 
ON public.reposts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all reposts" 
ON public.reposts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can delete their own reposts" 
ON public.reposts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX idx_reposts_user_id ON public.reposts(user_id);
CREATE INDEX idx_reposts_post_id ON public.reposts(post_id);
CREATE INDEX idx_reposts_created_at ON public.reposts(created_at DESC);