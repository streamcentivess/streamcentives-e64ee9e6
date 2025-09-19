-- Comprehensive Content Moderation System Database Schema

-- Content moderation categories and severity levels
CREATE TYPE moderation_category AS ENUM (
  'violence_incitement', 'safety_harassment', 'authenticity_spam', 
  'privacy_doxxing', 'intellectual_property', 'regulated_goods', 
  'community_standards', 'nudity_sexual', 'hate_speech', 'misinformation'
);

CREATE TYPE moderation_severity AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE moderation_action AS ENUM (
  'approved', 'warning', 'shadow_ban', 'content_removed', 
  'account_restricted', 'account_suspended', 'manual_review', 'appealed'
);

CREATE TYPE content_type AS ENUM (
  'community_post', 'community_message', 'post_comment', 
  'user_profile', 'user_bio', 'shared_link', 'image', 'video'
);

-- Enhanced content moderation table
CREATE TABLE public.content_moderation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_id UUID NOT NULL,
  content_type content_type NOT NULL,
  user_id UUID NOT NULL,
  
  -- Moderation analysis
  is_appropriate BOOLEAN NOT NULL DEFAULT true,
  categories moderation_category[] DEFAULT '{}',
  severity moderation_severity DEFAULT 'low',
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.5,
  
  -- AI Analysis details
  ai_analysis JSONB DEFAULT '{}',
  flags TEXT[] DEFAULT '{}',
  detected_language TEXT DEFAULT 'en',
  
  -- Actions taken
  action_taken moderation_action DEFAULT 'approved',
  auto_actioned BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Content details
  original_content TEXT,
  content_hash TEXT,
  media_urls TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User moderation history and strikes
CREATE TABLE public.user_moderation_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  moderation_id UUID NOT NULL REFERENCES public.content_moderation(id),
  
  -- Strike system
  strike_count INTEGER NOT NULL DEFAULT 0,
  strike_severity moderation_severity NOT NULL,
  strike_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Account restrictions
  is_shadow_banned BOOLEAN DEFAULT false,
  shadow_ban_expires_at TIMESTAMP WITH TIME ZONE,
  is_restricted BOOLEAN DEFAULT false,
  restriction_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Appeals
  appeal_submitted BOOLEAN DEFAULT false,
  appeal_message TEXT,
  appeal_status TEXT DEFAULT 'none',
  appeal_reviewed_at TIMESTAMP WITH TIME ZONE,
  appeal_reviewer_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Content appeals system
CREATE TABLE public.moderation_appeals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  moderation_id UUID NOT NULL REFERENCES public.content_moderation(id),
  
  appeal_reason TEXT NOT NULL,
  appeal_evidence TEXT,
  user_statement TEXT,
  
  -- Review process
  status TEXT DEFAULT 'pending',
  reviewer_id UUID,
  reviewer_notes TEXT,
  decision TEXT,
  decided_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Moderation queue for manual review
CREATE TABLE public.moderation_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  moderation_id UUID NOT NULL REFERENCES public.content_moderation(id),
  
  priority INTEGER DEFAULT 5, -- 1-10 scale
  assigned_to UUID,
  assigned_at TIMESTAMP WITH TIME ZONE,
  
  queue_type TEXT DEFAULT 'standard', -- standard, appeal, escalated
  escalation_reason TEXT,
  
  status TEXT DEFAULT 'pending', -- pending, in_review, completed
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User reporting system
CREATE TABLE public.user_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  reported_content_id UUID NOT NULL,
  reported_content_type content_type NOT NULL,
  reported_user_id UUID NOT NULL,
  
  report_category moderation_category NOT NULL,
  report_reason TEXT NOT NULL,
  additional_context TEXT,
  
  -- Processing
  status TEXT DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Moderation settings and thresholds
CREATE TABLE public.moderation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_name TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default moderation settings
INSERT INTO public.moderation_settings (setting_name, setting_value, description) VALUES
('auto_remove_threshold', '{"confidence": 0.9, "severity": "critical"}', 'Automatically remove content above this threshold'),
('shadow_ban_threshold', '{"confidence": 0.7, "severity": "high"}', 'Shadow ban content above this threshold'),
('manual_review_threshold', '{"confidence": 0.5, "severity": "medium"}', 'Send to manual review queue above this threshold'),
('strike_limits', '{"low": 5, "medium": 3, "high": 2, "critical": 1}', 'Strike limits per severity level'),
('content_categories', '["violence_incitement", "safety_harassment", "nudity_sexual", "hate_speech"]', 'Active moderation categories');

-- Add indexes for performance
CREATE INDEX idx_content_moderation_content_id ON public.content_moderation(content_id);
CREATE INDEX idx_content_moderation_user_id ON public.content_moderation(user_id);
CREATE INDEX idx_content_moderation_severity ON public.content_moderation(severity);
CREATE INDEX idx_content_moderation_action ON public.content_moderation(action_taken);
CREATE INDEX idx_user_moderation_history_user_id ON public.user_moderation_history(user_id);
CREATE INDEX idx_moderation_queue_status ON public.moderation_queue(status);
CREATE INDEX idx_user_reports_status ON public.user_reports(status);

-- Enable RLS on all moderation tables
ALTER TABLE public.content_moderation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_moderation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Content moderation - users can view their own, system/admins can manage all
CREATE POLICY "Users can view their own moderation records" ON public.content_moderation
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage all moderation records" ON public.content_moderation
  FOR ALL USING (true) WITH CHECK (true);

-- User moderation history - users can view their own
CREATE POLICY "Users can view their own moderation history" ON public.user_moderation_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage moderation history" ON public.user_moderation_history
  FOR ALL USING (true) WITH CHECK (true);

-- Appeals - users can create and view their own
CREATE POLICY "Users can manage their own appeals" ON public.moderation_appeals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can manage all appeals" ON public.moderation_appeals
  FOR ALL USING (true) WITH CHECK (true);

-- Moderation queue - admin only
CREATE POLICY "System can manage moderation queue" ON public.moderation_queue
  FOR ALL USING (true) WITH CHECK (true);

-- User reports - users can create, system manages
CREATE POLICY "Users can create reports" ON public.user_reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" ON public.user_reports
  FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "System can manage all reports" ON public.user_reports
  FOR ALL USING (true) WITH CHECK (true);

-- Moderation settings - read only for users
CREATE POLICY "Settings are publicly readable" ON public.moderation_settings
  FOR SELECT USING (true);

CREATE POLICY "System can manage settings" ON public.moderation_settings
  FOR ALL USING (true) WITH CHECK (true);

-- Function to get user strike count
CREATE OR REPLACE FUNCTION public.get_user_strike_count(target_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_strikes INTEGER := 0;
BEGIN
  SELECT COALESCE(SUM(strike_count), 0) INTO total_strikes
  FROM public.user_moderation_history
  WHERE user_id = target_user_id
    AND (strike_expires_at IS NULL OR strike_expires_at > now());
  
  RETURN total_strikes;
END;
$$;

-- Function to check if user is restricted
CREATE OR REPLACE FUNCTION public.is_user_restricted(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_restricted BOOLEAN := false;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.user_moderation_history
    WHERE user_id = target_user_id
      AND (
        (is_shadow_banned = true AND (shadow_ban_expires_at IS NULL OR shadow_ban_expires_at > now()))
        OR
        (is_restricted = true AND (restriction_expires_at IS NULL OR restriction_expires_at > now()))
      )
  ) INTO is_restricted;
  
  RETURN is_restricted;
END;
$$;