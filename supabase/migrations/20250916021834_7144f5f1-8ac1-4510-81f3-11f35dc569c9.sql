-- Phase 7: Advanced Integrations Tables

-- Social Media Integrations
CREATE TABLE social_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'instagram', 'tiktok', 'twitter', 'youtube', 'spotify'
  platform_user_id TEXT NOT NULL,
  platform_username TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  integration_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, platform)
);

-- Content Auto-Posting
CREATE TABLE auto_post_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID,
  platforms TEXT[] NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  post_content TEXT NOT NULL,
  media_urls TEXT[],
  hashtags TEXT[],
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'posted', 'failed', 'cancelled'
  posted_urls JSONB DEFAULT '{}', -- Platform-specific URLs
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Webhook Integrations
CREATE TABLE webhook_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_name TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  trigger_events TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT true,
  secret_key TEXT,
  retry_attempts INTEGER DEFAULT 3,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- API Usage Tracking
CREATE TABLE api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Phase 8: Enhanced Marketplace Tables

-- Marketplace Categories
CREATE TABLE marketplace_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  parent_category_id UUID REFERENCES marketplace_categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enhanced Marketplace Listings with Categories
ALTER TABLE marketplace_listings 
ADD COLUMN category_id UUID REFERENCES marketplace_categories(id),
ADD COLUMN condition TEXT DEFAULT 'new', -- 'new', 'like_new', 'good', 'fair'
ADD COLUMN shipping_cost_cents INTEGER DEFAULT 0,
ADD COLUMN shipping_regions TEXT[] DEFAULT '{}',
ADD COLUMN return_policy TEXT,
ADD COLUMN tags TEXT[] DEFAULT '{}',
ADD COLUMN featured_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN view_count INTEGER DEFAULT 0,
ADD COLUMN watch_count INTEGER DEFAULT 0;

-- Marketplace Watchers (for notifications)
CREATE TABLE marketplace_watchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Marketplace Offers
CREATE TABLE marketplace_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  offer_amount_cents INTEGER NOT NULL,
  offer_amount_xp INTEGER DEFAULT 0,
  message TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'rejected', 'expired'
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '72 hours'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Phase 9: Security & Performance Tables

-- User Sessions for Security
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  device_info JSONB DEFAULT '{}',
  location_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Security Audit Logs
CREATE TABLE security_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high', 'critical'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Content Moderation Queue
CREATE TABLE content_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL, -- 'message', 'campaign', 'post', 'profile'
  content_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reported_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'escalated'
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderator_notes TEXT,
  automated_flags JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 1, -- 1-5, higher is more urgent
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Phase 10: Enterprise Features Tables

-- Organizations/Teams
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  plan_type TEXT DEFAULT 'basic', -- 'basic', 'pro', 'enterprise'
  max_members INTEGER DEFAULT 10,
  billing_email TEXT,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Organization Members
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member', -- 'owner', 'admin', 'manager', 'member'
  permissions JSONB DEFAULT '{}',
  invited_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Team Campaigns
CREATE TABLE team_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  team_members UUID[] DEFAULT '{}',
  budget_allocation JSONB DEFAULT '{}',
  performance_metrics JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Advanced Analytics Views
CREATE TABLE advanced_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'roi', 'engagement', 'conversion', 'retention'
  metric_value NUMERIC NOT NULL,
  dimensions JSONB DEFAULT '{}', -- Additional context/grouping
  time_period TEXT NOT NULL, -- 'hour', 'day', 'week', 'month'
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS Policies for new tables
ALTER TABLE social_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_post_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE advanced_analytics ENABLE ROW LEVEL SECURITY;

-- Social Integrations Policies
CREATE POLICY "Users can manage their own social integrations" ON social_integrations
  FOR ALL USING (auth.uid() = user_id);

-- Auto Post Schedules Policies  
CREATE POLICY "Creators can manage their auto post schedules" ON auto_post_schedules
  FOR ALL USING (auth.uid() = creator_id);

-- Webhook Integrations Policies
CREATE POLICY "Users can manage their webhook integrations" ON webhook_integrations
  FOR ALL USING (auth.uid() = user_id);

-- API Usage Logs Policies
CREATE POLICY "Users can view their own API usage" ON api_usage_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can log API usage" ON api_usage_logs
  FOR INSERT WITH CHECK (true);

-- Marketplace Categories Policies
CREATE POLICY "Categories are publicly viewable" ON marketplace_categories
  FOR SELECT USING (is_active = true);

-- Marketplace Watchers Policies
CREATE POLICY "Users can manage their own watchlist" ON marketplace_watchers
  FOR ALL USING (auth.uid() = user_id);

-- Marketplace Offers Policies
CREATE POLICY "Users can view offers for their listings" ON marketplace_offers
  FOR SELECT USING (
    auth.uid() = buyer_id OR 
    EXISTS (SELECT 1 FROM marketplace_listings ml WHERE ml.id = listing_id AND ml.seller_id = auth.uid())
  );
CREATE POLICY "Users can create offers" ON marketplace_offers
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Sellers can update offer status" ON marketplace_offers
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM marketplace_listings ml WHERE ml.id = listing_id AND ml.seller_id = auth.uid())
  );

-- User Sessions Policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage sessions" ON user_sessions
  FOR ALL USING (true) WITH CHECK (true);

-- Security Audit Logs Policies
CREATE POLICY "Users can view their own audit logs" ON security_audit_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can create audit logs" ON security_audit_logs
  FOR INSERT WITH CHECK (true);

-- Content Moderation Policies
CREATE POLICY "System can manage moderation queue" ON content_moderation_queue
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Users can view reports they created" ON content_moderation_queue
  FOR SELECT USING (auth.uid() = reported_by_user_id OR auth.uid() = user_id);

-- Organizations Policies
CREATE POLICY "Organization members can view their organizations" ON organizations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = id AND om.user_id = auth.uid())
  );
CREATE POLICY "Users can create organizations" ON organizations
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Organization owners can update organizations" ON organizations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = id AND om.user_id = auth.uid() AND om.role = 'owner')
  );

-- Organization Members Policies
CREATE POLICY "Organization members can view team members" ON organization_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organization_id AND om.user_id = auth.uid())
  );
CREATE POLICY "Organization admins can manage members" ON organization_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organization_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin'))
  );

-- Team Campaigns Policies
CREATE POLICY "Organization members can view team campaigns" ON team_campaigns
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = team_campaigns.organization_id AND om.user_id = auth.uid())
  );
CREATE POLICY "Organization managers can manage team campaigns" ON team_campaigns
  FOR ALL USING (
    EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = team_campaigns.organization_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'manager'))
  );

-- Advanced Analytics Policies
CREATE POLICY "Users can view their own analytics" ON advanced_analytics
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Organization members can view org analytics" ON advanced_analytics
  FOR SELECT USING (
    organization_id IS NOT NULL AND
    EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = advanced_analytics.organization_id AND om.user_id = auth.uid())
  );
CREATE POLICY "System can create analytics" ON advanced_analytics
  FOR INSERT WITH CHECK (true);

-- Insert default marketplace categories
INSERT INTO marketplace_categories (name, description, icon_url, sort_order) VALUES
('Music Equipment', 'Instruments, audio gear, and recording equipment', NULL, 1),
('Concert Tickets', 'Live show and event tickets', NULL, 2),
('Merchandise', 'Artist branded clothing and accessories', NULL, 3),
('Collectibles', 'Limited edition items and memorabilia', NULL, 4),
('Digital Content', 'Exclusive tracks, videos, and digital art', NULL, 5),
('Experiences', 'Meet & greets, studio sessions, and unique opportunities', NULL, 6);

-- Create indexes for performance
CREATE INDEX idx_social_integrations_user_platform ON social_integrations(user_id, platform);
CREATE INDEX idx_auto_post_schedules_creator_status ON auto_post_schedules(creator_id, status);
CREATE INDEX idx_marketplace_listings_category ON marketplace_listings(category_id) WHERE is_active = true;
CREATE INDEX idx_marketplace_offers_listing_status ON marketplace_offers(listing_id, status);
CREATE INDEX idx_user_sessions_user_active ON user_sessions(user_id, is_active);
CREATE INDEX idx_security_audit_logs_user_action ON security_audit_logs(user_id, action);
CREATE INDEX idx_organization_members_org_user ON organization_members(organization_id, user_id);
CREATE INDEX idx_advanced_analytics_metric_time ON advanced_analytics(metric_type, recorded_at);