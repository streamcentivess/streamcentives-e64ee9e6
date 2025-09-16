-- Create shoutouts table for storing fan shoutouts
CREATE TABLE public.shoutouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  fan_id UUID NOT NULL,
  fan_display_name TEXT NOT NULL,
  fan_username TEXT,
  achievement_text TEXT NOT NULL,
  achievements_data JSONB DEFAULT '[]'::jsonb,
  shoutout_text TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'friendly',
  reward_id UUID,
  reward_data JSONB,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shoutouts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Creators can manage their own shoutouts" 
ON public.shoutouts 
FOR ALL 
USING (auth.uid() = creator_id);

CREATE POLICY "Fans can view shoutouts sent to them" 
ON public.shoutouts 
FOR SELECT 
USING (auth.uid() = fan_id);

CREATE POLICY "Fans can update read status of their shoutouts" 
ON public.shoutouts 
FOR UPDATE 
USING (auth.uid() = fan_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_shoutouts_updated_at
BEFORE UPDATE ON public.shoutouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();