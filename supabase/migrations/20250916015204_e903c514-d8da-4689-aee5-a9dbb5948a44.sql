-- Phase 3: Enhanced Communication & Social Features

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create message templates table
CREATE TABLE public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  template_content TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for message templates
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for message templates
CREATE POLICY "Creators can manage their own templates" 
ON public.message_templates 
FOR ALL 
USING (auth.uid() = creator_id);

-- Create social interactions table for tracking likes, follows, etc.
CREATE TABLE public.social_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  target_user_id UUID,
  target_content_id UUID,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'follow', 'share', 'comment', 'bookmark', 'repost')),
  content_type TEXT CHECK (content_type IN ('post', 'campaign', 'reward', 'message')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, target_user_id, interaction_type) WHERE target_user_id IS NOT NULL,
  UNIQUE(user_id, target_content_id, interaction_type, content_type) WHERE target_content_id IS NOT NULL
);

-- Enable RLS for social interactions
ALTER TABLE public.social_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for social interactions
CREATE POLICY "Users can manage their own interactions" 
ON public.social_interactions 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Social interactions are publicly viewable" 
ON public.social_interactions 
FOR SELECT 
USING (true);

-- Create notification delivery log table
CREATE TABLE public.notification_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  delivery_method TEXT NOT NULL CHECK (delivery_method IN ('in_app', 'email', 'push', 'sms', 'discord', 'slack')),
  delivery_status TEXT NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  delivered_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  external_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for notification deliveries
ALTER TABLE public.notification_deliveries ENABLE ROW LEVEL SECURITY;

-- Create policies for notification deliveries
CREATE POLICY "Users can view their notification deliveries" 
ON public.notification_deliveries 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.notifications n 
  WHERE n.id = notification_deliveries.notification_id 
  AND n.user_id = auth.uid()
));

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id_created_at ON public.notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_user_id_is_read ON public.notifications(user_id, is_read);
CREATE INDEX idx_social_interactions_user_id ON public.social_interactions(user_id);
CREATE INDEX idx_social_interactions_target_user_id ON public.social_interactions(target_user_id);
CREATE INDEX idx_social_interactions_target_content_id ON public.social_interactions(target_content_id);
CREATE INDEX idx_message_templates_creator_id ON public.message_templates(creator_id);

-- Add updated_at triggers
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_message_templates_updated_at
BEFORE UPDATE ON public.message_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_deliveries_updated_at
BEFORE UPDATE ON public.notification_deliveries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to send notification
CREATE OR REPLACE FUNCTION public.create_notification(
  user_id_param UUID,
  type_param TEXT,
  title_param TEXT,
  message_param TEXT,
  data_param JSONB DEFAULT '{}',
  action_url_param TEXT DEFAULT NULL,
  priority_param TEXT DEFAULT 'normal'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id, type, title, message, data, action_url, priority
  ) VALUES (
    user_id_param, type_param, title_param, message_param, 
    data_param, action_url_param, priority_param
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Create function to mark notifications as read
CREATE OR REPLACE FUNCTION public.mark_notifications_read(notification_ids UUID[])
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.notifications
  SET is_read = true, updated_at = now()
  WHERE id = ANY(notification_ids)
    AND user_id = auth.uid()
    AND is_read = false;
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Create function to get social interaction counts
CREATE OR REPLACE FUNCTION public.get_social_counts(
  target_content_id_param UUID,
  content_type_param TEXT
) RETURNS TABLE(
  interaction_type TEXT,
  count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    si.interaction_type,
    COUNT(*) as count
  FROM public.social_interactions si
  WHERE si.target_content_id = target_content_id_param
    AND si.content_type = content_type_param
  GROUP BY si.interaction_type;
END;
$$;