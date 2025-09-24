-- Create streamseeker_checklist table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.streamseeker_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL,
  pro_info_submitted BOOLEAN DEFAULT false,
  social_links_added BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,
  content_uploaded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(artist_id)
);

-- Enable RLS
ALTER TABLE public.streamseeker_checklist ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own checklist" 
ON public.streamseeker_checklist 
FOR SELECT 
USING (auth.uid() = artist_id);

CREATE POLICY "Users can create their own checklist" 
ON public.streamseeker_checklist 
FOR INSERT 
WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Users can update their own checklist" 
ON public.streamseeker_checklist 
FOR UPDATE 
USING (auth.uid() = artist_id);

-- Create trigger for timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_streamseeker_checklist_updated_at
BEFORE UPDATE ON public.streamseeker_checklist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();