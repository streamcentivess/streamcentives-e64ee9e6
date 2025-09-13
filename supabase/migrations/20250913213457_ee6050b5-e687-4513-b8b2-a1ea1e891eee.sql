-- Create user_haters table for managing haters list
CREATE TABLE public.user_haters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  hater_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, hater_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_haters ENABLE ROW LEVEL SECURITY;

-- Create policies for user_haters
CREATE POLICY "Users can manage their own haters list" 
ON public.user_haters 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view haters lists" 
ON public.user_haters 
FOR SELECT 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_user_haters_updated_at
BEFORE UPDATE ON public.user_haters
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();