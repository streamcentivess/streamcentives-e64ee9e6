-- Create smart_link_action_completions table to track verified actions
CREATE TABLE public.smart_link_action_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_id UUID NOT NULL REFERENCES public.smart_link_actions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_data JSONB DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(action_id, user_id)
);

-- Enable RLS
ALTER TABLE public.smart_link_action_completions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own action completions"
ON public.smart_link_action_completions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can manage action completions"
ON public.smart_link_action_completions
FOR ALL
USING (true)
WITH CHECK (true);

-- Add indexes for performance
CREATE INDEX idx_smart_link_action_completions_user_id ON public.smart_link_action_completions(user_id);
CREATE INDEX idx_smart_link_action_completions_action_id ON public.smart_link_action_completions(action_id);
CREATE INDEX idx_smart_link_action_completions_completed_at ON public.smart_link_action_completions(completed_at);