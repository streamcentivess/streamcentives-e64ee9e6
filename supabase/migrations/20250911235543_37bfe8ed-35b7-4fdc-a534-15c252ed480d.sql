-- Create webhook management tables
CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'content_generated', 'campaign_created', 'xp_earned', 'purchase_completed', etc.
  secret_key TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create webhook deliveries log
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  webhook_subscription_id UUID NOT NULL REFERENCES public.webhook_subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create social media credentials table
CREATE TABLE IF NOT EXISTS public.social_media_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'twitter', 'instagram', 'tiktok', 'facebook'
  api_key TEXT,
  api_secret TEXT,
  access_token TEXT,
  access_token_secret TEXT,
  refresh_token TEXT,
  page_id TEXT, -- For Facebook pages
  instagram_user_id TEXT, -- For Instagram business accounts
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Create social media posts log
CREATE TABLE IF NOT EXISTS public.social_media_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  content TEXT NOT NULL,
  post_id TEXT NOT NULL, -- Platform-specific post ID
  post_url TEXT,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  engagement_metrics JSONB DEFAULT '{}', -- likes, shares, comments, etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  phone_number TEXT,
  discord_webhook_url TEXT,
  slack_webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create automation rules table
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  trigger_event TEXT NOT NULL, -- 'content_generated', 'xp_milestone', 'campaign_goal_reached'
  conditions JSONB NOT NULL DEFAULT '{}', -- JSON conditions for triggering
  actions JSONB NOT NULL DEFAULT '[]', -- Array of actions to execute
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create automation execution log
CREATE TABLE IF NOT EXISTS public.automation_executions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_rule_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  trigger_data JSONB NOT NULL,
  execution_results JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  error_message TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for webhook subscriptions
CREATE POLICY "Users can manage their own webhooks" 
ON public.webhook_subscriptions 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for webhook deliveries (read-only for users)
CREATE POLICY "Users can view their webhook deliveries" 
ON public.webhook_deliveries 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.webhook_subscriptions 
    WHERE id = webhook_subscription_id
  )
);

-- Create RLS policies for social media credentials
CREATE POLICY "Users can manage their own social credentials" 
ON public.social_media_credentials 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for social media posts
CREATE POLICY "Users can view their own social posts" 
ON public.social_media_posts 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for notification preferences
CREATE POLICY "Users can manage their notification preferences" 
ON public.notification_preferences 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for automation rules
CREATE POLICY "Users can manage their automation rules" 
ON public.automation_rules 
FOR ALL 
USING (auth.uid() = user_id);

-- Create RLS policies for automation executions
CREATE POLICY "Users can view their automation executions" 
ON public.automation_executions 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.automation_rules 
    WHERE id = automation_rule_id
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_user_event ON public.webhook_subscriptions(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_subscription ON public.webhook_deliveries(webhook_subscription_id);
CREATE INDEX IF NOT EXISTS idx_social_credentials_user_platform ON public.social_media_credentials(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_platform ON public.social_media_posts(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_automation_rules_user_trigger ON public.automation_rules(user_id, trigger_event);

-- Create trigger functions for updated_at timestamps
CREATE TRIGGER update_webhook_subscriptions_updated_at
BEFORE UPDATE ON public.webhook_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_social_media_credentials_updated_at
BEFORE UPDATE ON public.social_media_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_rules_updated_at
BEFORE UPDATE ON public.automation_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();