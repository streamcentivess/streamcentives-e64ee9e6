-- Phase 5: Advanced Analytics & Monetization Tables

-- Analytics events table for tracking user interactions
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET,
  user_agent TEXT
);

-- Creator analytics summary table
CREATE TABLE public.creator_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_fans INTEGER NOT NULL DEFAULT 0,
  new_fans INTEGER NOT NULL DEFAULT 0,
  total_campaigns INTEGER NOT NULL DEFAULT 0,
  active_campaigns INTEGER NOT NULL DEFAULT 0,
  total_xp_awarded INTEGER NOT NULL DEFAULT 0,
  total_cash_awarded DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_messages_received INTEGER NOT NULL DEFAULT 0,
  total_message_revenue_cents INTEGER NOT NULL DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(creator_id, date)
);

-- Revenue tracking table
CREATE TABLE public.revenue_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  transaction_type TEXT NOT NULL, -- 'xp_purchase', 'message_fee', 'campaign_reward', 'marketplace_sale'
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  fee_cents INTEGER NOT NULL DEFAULT 0,
  net_amount_cents INTEGER NOT NULL,
  source_id UUID, -- reference to campaign, message, etc.
  stripe_transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User engagement metrics table
CREATE TABLE public.user_engagement_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  sessions_count INTEGER NOT NULL DEFAULT 0,
  total_session_duration_minutes INTEGER NOT NULL DEFAULT 0,
  campaigns_participated INTEGER NOT NULL DEFAULT 0,
  messages_sent INTEGER NOT NULL DEFAULT 0,
  posts_liked INTEGER NOT NULL DEFAULT 0,
  posts_shared INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS on all tables
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_engagement_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_events
CREATE POLICY "Users can view their own analytics events" 
ON public.analytics_events FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create analytics events" 
ON public.analytics_events FOR INSERT 
WITH CHECK (true);

-- RLS Policies for creator_analytics
CREATE POLICY "Creators can view their own analytics" 
ON public.creator_analytics FOR SELECT 
USING (auth.uid() = creator_id);

CREATE POLICY "System can manage creator analytics" 
ON public.creator_analytics FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS Policies for revenue_transactions
CREATE POLICY "Users can view their own revenue transactions" 
ON public.revenue_transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage revenue transactions" 
ON public.revenue_transactions FOR ALL 
USING (true)
WITH CHECK (true);

-- RLS Policies for user_engagement_metrics
CREATE POLICY "Users can view their own engagement metrics" 
ON public.user_engagement_metrics FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage engagement metrics" 
ON public.user_engagement_metrics FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_analytics_events_user_created ON public.analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_creator_analytics_creator_date ON public.creator_analytics(creator_id, date DESC);
CREATE INDEX idx_revenue_transactions_user_created ON public.revenue_transactions(user_id, created_at DESC);
CREATE INDEX idx_revenue_transactions_type ON public.revenue_transactions(transaction_type);
CREATE INDEX idx_user_engagement_user_date ON public.user_engagement_metrics(user_id, date DESC);

-- Create functions for analytics calculations
CREATE OR REPLACE FUNCTION public.calculate_creator_daily_analytics(creator_user_id UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.creator_analytics (
    creator_id,
    date,
    total_fans,
    new_fans,
    total_campaigns,
    active_campaigns,
    total_xp_awarded,
    total_cash_awarded,
    total_messages_received,
    total_message_revenue_cents
  )
  SELECT 
    creator_user_id,
    target_date,
    COALESCE(fan_counts.total_fans, 0),
    COALESCE(fan_counts.new_fans, 0),
    COALESCE(campaign_stats.total_campaigns, 0),
    COALESCE(campaign_stats.active_campaigns, 0),
    COALESCE(xp_stats.total_xp, 0),
    COALESCE(cash_stats.total_cash, 0),
    COALESCE(message_stats.message_count, 0),
    COALESCE(message_stats.revenue_cents, 0)
  FROM (
    SELECT 
      COUNT(*) as total_fans,
      COUNT(*) FILTER (WHERE DATE(f.created_at) = target_date) as new_fans
    FROM follows f
    WHERE f.following_id = creator_user_id
  ) fan_counts
  CROSS JOIN (
    SELECT 
      COUNT(*) as total_campaigns,
      COUNT(*) FILTER (WHERE c.status = 'active') as active_campaigns
    FROM campaigns c
    WHERE c.creator_id = creator_user_id
  ) campaign_stats
  CROSS JOIN (
    SELECT 
      COALESCE(SUM(cp.xp_earned), 0) as total_xp
    FROM campaign_participants cp
    JOIN campaigns c ON c.id = cp.campaign_id
    WHERE c.creator_id = creator_user_id
      AND DATE(cp.created_at) = target_date
  ) xp_stats
  CROSS JOIN (
    SELECT 
      COALESCE(SUM(cp.cash_earned), 0) as total_cash
    FROM campaign_participants cp
    JOIN campaigns c ON c.id = cp.campaign_id
    WHERE c.creator_id = creator_user_id
      AND DATE(cp.created_at) = target_date
  ) cash_stats
  CROSS JOIN (
    SELECT 
      COUNT(*) as message_count,
      COALESCE(SUM(m.xp_cost * 0.01), 0) as revenue_cents -- Assuming 1% of XP cost as revenue
    FROM messages m
    WHERE m.recipient_id = creator_user_id
      AND DATE(m.created_at) = target_date
  ) message_stats
  ON CONFLICT (creator_id, date) 
  DO UPDATE SET
    total_fans = EXCLUDED.total_fans,
    new_fans = EXCLUDED.new_fans,
    total_campaigns = EXCLUDED.total_campaigns,
    active_campaigns = EXCLUDED.active_campaigns,
    total_xp_awarded = EXCLUDED.total_xp_awarded,
    total_cash_awarded = EXCLUDED.total_cash_awarded,
    total_messages_received = EXCLUDED.total_messages_received,
    total_message_revenue_cents = EXCLUDED.total_message_revenue_cents,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;