-- Create a table for user supporters (different from follows)
CREATE TABLE public.user_supporters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL, -- The user who owns the supporters list
  supporter_id UUID NOT NULL, -- The user being added as a supporter
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, supporter_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_supporters ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view supporters lists" 
ON public.user_supporters 
FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their own supporters" 
ON public.user_supporters 
FOR ALL
USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX idx_user_supporters_user_id ON public.user_supporters(user_id);
CREATE INDEX idx_user_supporters_supporter_id ON public.user_supporters(supporter_id);