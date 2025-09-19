-- Create campaign collaborators table for multi-creator/sponsor campaigns
CREATE TABLE public.campaign_collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'collaborator', -- 'creator', 'sponsor', 'collaborator'
  permissions JSONB DEFAULT '{"can_edit": true, "can_invite": false, "can_delete": false}'::jsonb,
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- Enable RLS
ALTER TABLE public.campaign_collaborators ENABLE ROW LEVEL SECURITY;

-- Policies for campaign collaborators
CREATE POLICY "Collaborators can view campaign collaborators" 
ON public.campaign_collaborators FOR SELECT
USING (
  EXISTS(
    SELECT 1 FROM public.campaign_collaborators cc
    WHERE cc.campaign_id = campaign_collaborators.campaign_id 
    AND cc.user_id = auth.uid()
  ) OR
  EXISTS(
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_collaborators.campaign_id 
    AND c.creator_id = auth.uid()
  )
);

CREATE POLICY "Campaign creators can manage collaborators" 
ON public.campaign_collaborators FOR ALL
USING (
  EXISTS(
    SELECT 1 FROM public.campaigns c
    WHERE c.id = campaign_collaborators.campaign_id 
    AND c.creator_id = auth.uid()
  )
);

CREATE POLICY "Users can join as collaborators" 
ON public.campaign_collaborators FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_campaign_collaborators_campaign_id ON public.campaign_collaborators(campaign_id);
CREATE INDEX idx_campaign_collaborators_user_id ON public.campaign_collaborators(user_id);

-- Function to get campaigns for a user including collaborative ones
CREATE OR REPLACE FUNCTION public.get_user_campaigns(target_user_id UUID)
RETURNS TABLE(
  campaign_id UUID,
  is_creator BOOLEAN,
  is_collaborator BOOLEAN,
  role TEXT,
  permissions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as campaign_id,
    (c.creator_id = target_user_id) as is_creator,
    (cc.user_id IS NOT NULL) as is_collaborator,
    COALESCE(cc.role, 'creator') as role,
    COALESCE(cc.permissions, '{"can_edit": true, "can_invite": true, "can_delete": true}'::jsonb) as permissions
  FROM public.campaigns c
  LEFT JOIN public.campaign_collaborators cc ON c.id = cc.campaign_id AND cc.user_id = target_user_id
  WHERE c.creator_id = target_user_id 
     OR cc.user_id = target_user_id;
END;
$$;

-- Update campaigns table to track collaboration
ALTER TABLE public.campaigns 
ADD COLUMN collaboration_enabled BOOLEAN DEFAULT false,
ADD COLUMN collaborator_count INTEGER DEFAULT 0;

-- Trigger to update collaborator count
CREATE OR REPLACE FUNCTION public.update_collaborator_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.campaigns 
    SET collaborator_count = collaborator_count + 1
    WHERE id = NEW.campaign_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.campaigns 
    SET collaborator_count = collaborator_count - 1
    WHERE id = OLD.campaign_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_campaign_collaborator_count
  AFTER INSERT OR DELETE ON public.campaign_collaborators
  FOR EACH ROW EXECUTE FUNCTION public.update_collaborator_count();