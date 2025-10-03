-- Phase 7: Platform Optimization & Monetization Tables (Clean Install)

-- Drop tables if they exist
DROP TABLE IF EXISTS public.creator_payouts CASCADE;
DROP TABLE IF EXISTS public.content_moderation CASCADE;
DROP TABLE IF EXISTS public.platform_revenue CASCADE;
DROP TABLE IF EXISTS public.notification_preferences CASCADE;
DROP TABLE IF EXISTS public.creator_verifications CASCADE;

-- Creator verification requests and status
CREATE TABLE public.creator_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    verification_type TEXT NOT NULL CHECK (verification_type IN ('identity', 'creator', 'business', 'blue_check')),
    submitted_documents JSONB DEFAULT '[]'::jsonb,
    rejection_reason TEXT,
    reviewer_notes TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, verification_type)
);

-- Notification preferences per user
CREATE TABLE public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    
    -- Notification type preferences
    follow_notifications BOOLEAN DEFAULT true,
    like_notifications BOOLEAN DEFAULT true,
    comment_notifications BOOLEAN DEFAULT true,
    repost_notifications BOOLEAN DEFAULT true,
    share_notifications BOOLEAN DEFAULT true,
    tag_notifications BOOLEAN DEFAULT true,
    message_notifications BOOLEAN DEFAULT true,
    campaign_join_notifications BOOLEAN DEFAULT true,
    reward_purchase_notifications BOOLEAN DEFAULT true,
    reward_notifications BOOLEAN DEFAULT true,
    milestone_notifications BOOLEAN DEFAULT true,
    offer_notifications BOOLEAN DEFAULT true,
    
    -- Digest preferences
    daily_digest BOOLEAN DEFAULT false,
    weekly_digest BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Platform-wide revenue tracking
CREATE TABLE public.platform_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Revenue sources
    xp_sales_cents INTEGER NOT NULL DEFAULT 0,
    marketplace_fees_cents INTEGER NOT NULL DEFAULT 0,
    creator_cashout_fees_cents INTEGER NOT NULL DEFAULT 0,
    brand_deal_fees_cents INTEGER NOT NULL DEFAULT 0,
    subscription_revenue_cents INTEGER NOT NULL DEFAULT 0,
    
    -- Volume metrics
    total_xp_purchased INTEGER NOT NULL DEFAULT 0,
    total_xp_spent INTEGER NOT NULL DEFAULT 0,
    total_marketplace_transactions INTEGER NOT NULL DEFAULT 0,
    total_active_users INTEGER NOT NULL DEFAULT 0,
    total_new_users INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    UNIQUE(date)
);

-- Content moderation queue
CREATE TABLE public.content_moderation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'message', 'story', 'comment', 'profile', 'campaign')),
    content_id UUID NOT NULL,
    reported_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    content_owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'reviewing', 'approved', 'rejected', 'flagged')),
    severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    report_reason TEXT NOT NULL CHECK (report_reason IN (
        'spam', 'harassment', 'hate_speech', 'violence', 
        'inappropriate_content', 'copyright', 'misinformation', 'other'
    )),
    report_description TEXT,
    
    ai_moderation_score NUMERIC(3,2) CHECK (ai_moderation_score >= 0 AND ai_moderation_score <= 1),
    ai_moderation_flags JSONB DEFAULT '[]'::jsonb,
    
    reviewed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewer_action TEXT CHECK (reviewer_action IN ('approved', 'removed', 'warning_issued', 'user_banned')),
    reviewer_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Creator payout requests
CREATE TABLE public.creator_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- XP to cash conversion
    xp_amount INTEGER NOT NULL CHECK (xp_amount > 0),
    fiat_amount_cents INTEGER NOT NULL CHECK (fiat_amount_cents > 0),
    fee_amount_cents INTEGER NOT NULL DEFAULT 0,
    net_amount_cents INTEGER NOT NULL CHECK (net_amount_cents > 0),
    
    -- Payout details
    payout_method TEXT NOT NULL CHECK (payout_method IN ('stripe', 'paypal', 'bank_transfer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    stripe_payout_id TEXT,
    bank_account_last4 TEXT,
    
    requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_creator_verifications_user_status ON public.creator_verifications(user_id, status);
CREATE INDEX idx_creator_verifications_status ON public.creator_verifications(status, requested_at DESC);
CREATE INDEX idx_platform_revenue_date ON public.platform_revenue(date DESC);
CREATE INDEX idx_content_moderation_status ON public.content_moderation(moderation_status, created_at DESC);
CREATE INDEX idx_content_moderation_severity ON public.content_moderation(severity, created_at DESC);
CREATE INDEX idx_creator_payouts_creator ON public.creator_payouts(creator_id, status);
CREATE INDEX idx_creator_payouts_status ON public.creator_payouts(status, requested_at DESC);

-- Row Level Security Policies

-- Creator Verifications
ALTER TABLE public.creator_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own verification requests"
    ON public.creator_verifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verification requests"
    ON public.creator_verifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all verifications"
    ON public.creator_verifications FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Notification Preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own notification preferences"
    ON public.notification_preferences FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Platform Revenue (admin only)
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view platform revenue"
    ON public.platform_revenue FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage platform revenue"
    ON public.platform_revenue FOR ALL
    USING (true)
    WITH CHECK (true);

-- Content Moderation
ALTER TABLE public.content_moderation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can report content"
    ON public.content_moderation FOR INSERT
    WITH CHECK (auth.uid() = reported_by_user_id);

CREATE POLICY "Users can view their own reports"
    ON public.content_moderation FOR SELECT
    USING (auth.uid() = reported_by_user_id OR auth.uid() = content_owner_id);

CREATE POLICY "Admins can manage all moderation"
    ON public.content_moderation FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Creator Payouts
ALTER TABLE public.creator_payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view their own payouts"
    ON public.creator_payouts FOR SELECT
    USING (auth.uid() = creator_id);

CREATE POLICY "Creators can request payouts"
    ON public.creator_payouts FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Admins can manage all payouts"
    ON public.creator_payouts FOR ALL
    USING (public.has_role(auth.uid(), 'admin'));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_preferences;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content_moderation;