-- Create campaigns table
CREATE TABLE public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('streaming', 'social_media', 'engagement', 'merchandise', 'event', 'challenge')),
  xp_reward INTEGER NOT NULL DEFAULT 0,
  cash_reward DECIMAL(10,2) DEFAULT 0,
  target_metric TEXT, -- e.g., 'streams', 'shares', 'likes', 'comments'
  target_value INTEGER, -- target number to reach
  current_progress INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
  max_participants INTEGER,
  image_url TEXT,
  tags TEXT[],
  requirements TEXT, -- JSON string for complex requirements
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Creators can manage their own campaigns
CREATE POLICY "Creators can manage their own campaigns"
ON public.campaigns
FOR ALL
USING (auth.uid() = creator_id);

-- Everyone can view active campaigns
CREATE POLICY "Users can view active campaigns"
ON public.campaigns
FOR SELECT
USING (status IN ('active', 'completed'));

-- Create campaign participants table
CREATE TABLE public.campaign_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  progress INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  cash_earned DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped_out')),
  completion_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- Enable RLS on participants
ALTER TABLE public.campaign_participants ENABLE ROW LEVEL SECURITY;

-- Users can view their own participation
CREATE POLICY "Users can view their own participation"
ON public.campaign_participants
FOR SELECT
USING (auth.uid() = user_id);

-- Users can join campaigns (insert their own participation)
CREATE POLICY "Users can join campaigns"
ON public.campaign_participants
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own participation
CREATE POLICY "Users can update their own participation"
ON public.campaign_participants
FOR UPDATE
USING (auth.uid() = user_id);

-- Creators can view participants of their campaigns
CREATE POLICY "Creators can view their campaign participants"
ON public.campaign_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campaign_id AND c.creator_id = auth.uid()
  )
);

-- Creators can update participants of their campaigns
CREATE POLICY "Creators can update their campaign participants"
ON public.campaign_participants
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.campaigns c 
    WHERE c.id = campaign_id AND c.creator_id = auth.uid()
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_campaigns_updated_at
BEFORE UPDATE ON public.campaigns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_campaign_participants_updated_at
BEFORE UPDATE ON public.campaign_participants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to get campaign stats
CREATE OR REPLACE FUNCTION public.get_campaign_stats(campaign_id_param UUID)
RETURNS TABLE (
  participant_count INTEGER,
  completed_count INTEGER,
  total_xp_distributed INTEGER,
  total_cash_distributed DECIMAL(10,2),
  average_progress DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as participant_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END)::INTEGER as completed_count,
    COALESCE(SUM(xp_earned), 0)::INTEGER as total_xp_distributed,
    COALESCE(SUM(cash_earned), 0)::DECIMAL(10,2) as total_cash_distributed,
    COALESCE(AVG(progress), 0)::DECIMAL(5,2) as average_progress
  FROM public.campaign_participants
  WHERE campaign_id = campaign_id_param;
END;
$$;