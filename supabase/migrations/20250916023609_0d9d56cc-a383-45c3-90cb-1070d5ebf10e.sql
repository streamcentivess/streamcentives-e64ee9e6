-- Phase 11: Advanced Analytics & Business Intelligence
CREATE TABLE public.revenue_forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    forecast_period TEXT NOT NULL, -- monthly, quarterly, yearly
    predicted_revenue_cents INTEGER NOT NULL DEFAULT 0,
    confidence_score NUMERIC(5,2) DEFAULT 0.00,
    data_points JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    forecast_date DATE NOT NULL
);

CREATE TABLE public.fan_behavior_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fan_id UUID NOT NULL,
    creator_id UUID NOT NULL,
    behavior_type TEXT NOT NULL, -- engagement, purchase, view, etc.
    behavior_data JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    session_id TEXT,
    device_info JSONB DEFAULT '{}'
);

CREATE TABLE public.campaign_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL,
    predicted_participants INTEGER DEFAULT 0,
    predicted_completion_rate NUMERIC(5,2) DEFAULT 0.00,
    predicted_revenue_cents INTEGER DEFAULT 0,
    prediction_accuracy NUMERIC(5,2),
    model_version TEXT DEFAULT 'v1.0',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.custom_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    report_name TEXT NOT NULL,
    report_config JSONB NOT NULL DEFAULT '{}',
    schedule_config JSONB, -- for automated reports
    is_scheduled BOOLEAN DEFAULT false,
    last_generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Phase 12: Enhanced Communication & Engagement
CREATE TABLE public.push_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending', -- pending, sent, failed, clicked
    sent_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    device_tokens TEXT[], -- for targeting specific devices
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    campaign_name TEXT NOT NULL,
    subject_line TEXT NOT NULL,
    email_content TEXT NOT NULL,
    recipient_list JSONB NOT NULL DEFAULT '[]',
    scheduled_send_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft', -- draft, scheduled, sending, sent, cancelled
    open_rate NUMERIC(5,2) DEFAULT 0.00,
    click_rate NUMERIC(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.sms_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    campaign_name TEXT NOT NULL,
    message_content TEXT NOT NULL,
    recipient_phones JSONB NOT NULL DEFAULT '[]',
    scheduled_send_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'draft',
    delivery_rate NUMERIC(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.live_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    stream_title TEXT NOT NULL,
    stream_description TEXT,
    stream_url TEXT,
    platform TEXT NOT NULL, -- twitch, youtube, custom
    status TEXT DEFAULT 'scheduled', -- scheduled, live, ended
    scheduled_start_time TIMESTAMP WITH TIME ZONE,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    viewer_count INTEGER DEFAULT 0,
    peak_viewers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.video_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    message_text TEXT,
    xp_cost INTEGER NOT NULL DEFAULT 150,
    status TEXT DEFAULT 'pending', -- pending, approved, denied
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    approved_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE
);

-- Phase 13: Monetization & Financial Tools
CREATE TABLE public.subscription_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    tier_name TEXT NOT NULL,
    tier_description TEXT,
    price_cents INTEGER NOT NULL,
    billing_interval TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly
    benefits JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    max_subscribers INTEGER,
    current_subscribers INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscriber_id UUID NOT NULL,
    tier_id UUID NOT NULL,
    status TEXT DEFAULT 'active', -- active, cancelled, expired, paused
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    auto_renewal BOOLEAN DEFAULT true,
    stripe_subscription_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.tip_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    amount_cents INTEGER NOT NULL,
    currency TEXT DEFAULT 'usd',
    message TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'completed',
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.affiliate_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    program_name TEXT NOT NULL,
    commission_rate NUMERIC(5,2) NOT NULL, -- percentage
    product_url TEXT NOT NULL,
    tracking_code TEXT NOT NULL,
    total_clicks INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    total_earnings_cents INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.tax_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    tax_year INTEGER NOT NULL,
    document_type TEXT NOT NULL, -- 1099, W2, etc.
    document_url TEXT,
    total_earnings_cents INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, generated, sent
    generated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.crypto_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payer_id UUID NOT NULL,
    recipient_id UUID NOT NULL,
    cryptocurrency TEXT NOT NULL, -- BTC, ETH, etc.
    amount_crypto NUMERIC(18,8) NOT NULL,
    amount_usd_cents INTEGER NOT NULL,
    wallet_address TEXT NOT NULL,
    transaction_hash TEXT,
    status TEXT DEFAULT 'pending', -- pending, confirmed, failed
    confirmations INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

-- Phase 14: Content & Creator Tools  
CREATE TABLE public.content_scheduler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    content_type TEXT NOT NULL, -- post, story, video, etc.
    content_data JSONB NOT NULL DEFAULT '{}',
    platforms TEXT[] NOT NULL, -- array of social platforms
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'scheduled', -- scheduled, posted, failed, cancelled
    posted_urls JSONB DEFAULT '{}',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.content_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    template_name TEXT NOT NULL,
    template_type TEXT NOT NULL, -- post, email, campaign, etc.
    template_content JSONB NOT NULL DEFAULT '{}',
    usage_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.brand_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    asset_name TEXT NOT NULL,
    asset_type TEXT NOT NULL, -- logo, banner, font, color_palette
    asset_url TEXT,
    asset_data JSONB DEFAULT '{}', -- for colors, fonts, etc.
    file_size_bytes BIGINT,
    mime_type TEXT,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.team_collaborations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    collaborator_id UUID NOT NULL,
    role TEXT NOT NULL DEFAULT 'member', -- owner, admin, editor, member
    permissions JSONB NOT NULL DEFAULT '{}',
    status TEXT DEFAULT 'active', -- active, suspended, removed
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    joined_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Phase 15: Platform Scaling & Enterprise
CREATE TABLE public.language_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    secondary_languages TEXT[] DEFAULT '{}',
    auto_translate BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.white_label_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    brand_name TEXT NOT NULL,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#000000',
    secondary_color TEXT DEFAULT '#ffffff',
    custom_domain TEXT,
    features_enabled JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    key_name TEXT NOT NULL,
    api_key TEXT NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}',
    rate_limit INTEGER DEFAULT 1000, -- requests per hour
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.admin_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    action_type TEXT NOT NULL, -- user_suspend, content_moderate, etc.
    target_id UUID NOT NULL,
    target_type TEXT NOT NULL, -- user, content, campaign, etc.
    action_data JSONB DEFAULT '{}',
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.integration_marketplace (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    developer_id UUID NOT NULL,
    integration_name TEXT NOT NULL,
    integration_description TEXT,
    category TEXT NOT NULL,
    logo_url TEXT,
    webhook_url TEXT,
    api_endpoints JSONB DEFAULT '{}',
    pricing_model TEXT DEFAULT 'free', -- free, paid, freemium
    installation_count INTEGER DEFAULT 0,
    rating NUMERIC(3,2) DEFAULT 0.00,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Missing Features: Advanced AI & ML
CREATE TABLE public.content_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    recommended_content_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    recommendation_score NUMERIC(5,4) NOT NULL,
    recommendation_reason JSONB DEFAULT '{}',
    viewed BOOLEAN DEFAULT false,
    clicked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.ai_moderation_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL,
    ai_confidence NUMERIC(5,4) NOT NULL,
    ai_flags JSONB NOT NULL DEFAULT '[]',
    human_review_needed BOOLEAN DEFAULT false,
    reviewed_by_user_id UUID,
    final_decision TEXT, -- approved, rejected, needs_changes
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.engagement_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    predicted_engagement JSONB NOT NULL DEFAULT '{}',
    prediction_timeframe TEXT NOT NULL, -- daily, weekly, monthly
    model_version TEXT DEFAULT 'v1.0',
    accuracy_score NUMERIC(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Missing Features: Community Features
CREATE TABLE public.fan_communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    community_name TEXT NOT NULL,
    community_description TEXT,
    community_rules JSONB DEFAULT '[]',
    is_public BOOLEAN DEFAULT true,
    member_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role TEXT DEFAULT 'member', -- owner, moderator, member
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT DEFAULT 'active', -- active, suspended, banned
    UNIQUE(community_id, user_id)
);

CREATE TABLE public.community_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID NOT NULL,
    author_id UUID NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.fan_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    event_name TEXT NOT NULL,
    event_description TEXT,
    event_type TEXT NOT NULL, -- meetup, concert, virtual, etc.
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    location_data JSONB DEFAULT '{}',
    max_attendees INTEGER,
    current_attendees INTEGER DEFAULT 0,
    ticket_price_cents INTEGER DEFAULT 0,
    is_virtual BOOLEAN DEFAULT false,
    meeting_url TEXT,
    status TEXT DEFAULT 'upcoming', -- upcoming, live, completed, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.event_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    user_id UUID NOT NULL,
    ticket_id TEXT,
    check_in_time TIMESTAMP WITH TIME ZONE,
    attended BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(event_id, user_id)
);

-- Missing Features: Business Development
CREATE TABLE public.brand_partnerships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    brand_name TEXT NOT NULL,
    brand_contact_info JSONB NOT NULL DEFAULT '{}',
    partnership_type TEXT NOT NULL, -- sponsorship, collaboration, etc.
    contract_details JSONB DEFAULT '{}',
    compensation_amount_cents INTEGER,
    status TEXT DEFAULT 'pending', -- pending, active, completed, cancelled
    start_date DATE,
    end_date DATE,
    deliverables JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.sponsorship_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partnership_id UUID NOT NULL,
    campaign_name TEXT NOT NULL,
    campaign_brief TEXT,
    required_deliverables JSONB NOT NULL DEFAULT '[]',
    compensation_cents INTEGER NOT NULL,
    deadline DATE,
    status TEXT DEFAULT 'active',
    submitted_content JSONB DEFAULT '[]',
    approval_status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.media_kits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL,
    kit_name TEXT NOT NULL,
    creator_bio TEXT,
    statistics JSONB NOT NULL DEFAULT '{}',
    demographics JSONB DEFAULT '{}',
    rate_card JSONB DEFAULT '{}',
    sample_content JSONB DEFAULT '[]',
    contact_information JSONB NOT NULL DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    download_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.revenue_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_behavior_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tip_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crypto_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_scheduler ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_collaborations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.language_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.white_label_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_marketplace ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagement_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorship_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_kits ENABLE ROW LEVEL SECURITY;