-- RLS Policies for Phase 11: Advanced Analytics & Business Intelligence
CREATE POLICY "Creators can view their revenue forecasts" ON public.revenue_forecasts
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "System can create revenue forecasts" ON public.revenue_forecasts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Creators can view fan behavior for their content" ON public.fan_behavior_analytics
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "System can track fan behavior" ON public.fan_behavior_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Creators can view their campaign predictions" ON public.campaign_predictions
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM campaigns c WHERE c.id = campaign_id AND c.creator_id = auth.uid()
  ));

CREATE POLICY "System can create campaign predictions" ON public.campaign_predictions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can manage their custom reports" ON public.custom_reports
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for Phase 12: Enhanced Communication & Engagement
CREATE POLICY "Users can view their push notifications" ON public.push_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage push notifications" ON public.push_notifications
  FOR ALL USING (true);

CREATE POLICY "Creators can manage their email campaigns" ON public.email_campaigns
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Creators can manage their SMS campaigns" ON public.sms_campaigns
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Creators can manage their live streams" ON public.live_streams
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Everyone can view active live streams" ON public.live_streams
  FOR SELECT USING (status = 'live');

CREATE POLICY "Users can send video messages" ON public.video_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view video messages they sent or received" ON public.video_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Recipients can update video message status" ON public.video_messages
  FOR UPDATE USING (auth.uid() = recipient_id);

-- RLS Policies for Phase 13: Monetization & Financial Tools
CREATE POLICY "Creators can manage their subscription tiers" ON public.subscription_tiers
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Everyone can view active subscription tiers" ON public.subscription_tiers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view their own subscriptions" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = subscriber_id);

CREATE POLICY "Users can create their own subscriptions" ON public.user_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = subscriber_id);

CREATE POLICY "Users can update their own subscriptions" ON public.user_subscriptions
  FOR UPDATE USING (auth.uid() = subscriber_id);

CREATE POLICY "Users can view tips they sent or received" ON public.tip_donations
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send tips" ON public.tip_donations
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Creators can manage their affiliate programs" ON public.affiliate_programs
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Users can view their tax documents" ON public.tax_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage tax documents" ON public.tax_documents
  FOR ALL USING (true);

CREATE POLICY "Users can view their crypto payments" ON public.crypto_payments
  FOR SELECT USING (auth.uid() = payer_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can create crypto payments" ON public.crypto_payments
  FOR INSERT WITH CHECK (auth.uid() = payer_id);

-- RLS Policies for Phase 14: Content & Creator Tools
CREATE POLICY "Creators can manage their content scheduler" ON public.content_scheduler
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Creators can manage their content templates" ON public.content_templates
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Everyone can view public templates" ON public.content_templates
  FOR SELECT USING (is_public = true);

CREATE POLICY "Creators can manage their brand assets" ON public.brand_assets
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Team members can view collaboration info" ON public.team_collaborations
  FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = collaborator_id);

CREATE POLICY "Creators can manage team collaborations" ON public.team_collaborations
  FOR ALL USING (auth.uid() = creator_id);

-- RLS Policies for Phase 15: Platform Scaling & Enterprise
CREATE POLICY "Users can manage their language preferences" ON public.language_preferences
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Organization members can view white label configs" ON public.white_label_configs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM organization_members om WHERE om.organization_id = white_label_configs.organization_id AND om.user_id = auth.uid()
  ));

CREATE POLICY "Organization owners can manage white label configs" ON public.white_label_configs
  FOR ALL USING (EXISTS (
    SELECT 1 FROM organization_members om WHERE om.organization_id = white_label_configs.organization_id 
    AND om.user_id = auth.uid() AND om.role = 'owner'
  ));

CREATE POLICY "Users can manage their API keys" ON public.api_keys
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "System can create admin controls" ON public.admin_controls
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view admin controls" ON public.admin_controls
  FOR SELECT USING (true); -- Will be enhanced with proper admin role check

CREATE POLICY "Everyone can view active integrations" ON public.integration_marketplace
  FOR SELECT USING (is_active = true);

CREATE POLICY "Developers can manage their integrations" ON public.integration_marketplace
  FOR ALL USING (auth.uid() = developer_id);

-- RLS Policies for Advanced AI & ML Features
CREATE POLICY "Users can view their content recommendations" ON public.content_recommendations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create content recommendations" ON public.content_recommendations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can manage AI moderation queue" ON public.ai_moderation_queue
  FOR ALL WITH CHECK (true);

CREATE POLICY "Creators can view their engagement predictions" ON public.engagement_predictions
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "System can create engagement predictions" ON public.engagement_predictions
  FOR INSERT WITH CHECK (true);

-- RLS Policies for Community Features
CREATE POLICY "Creators can manage their communities" ON public.fan_communities
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Everyone can view public communities" ON public.fan_communities
  FOR SELECT USING (is_public = true AND is_active = true);

CREATE POLICY "Community members can view their memberships" ON public.community_members
  FOR SELECT USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM fan_communities fc WHERE fc.id = community_id AND fc.creator_id = auth.uid()
  ));

CREATE POLICY "Users can join communities" ON public.community_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities" ON public.community_members
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Community creators can manage members" ON public.community_members
  FOR ALL USING (EXISTS (
    SELECT 1 FROM fan_communities fc WHERE fc.id = community_id AND fc.creator_id = auth.uid()
  ));

CREATE POLICY "Community members can view posts" ON public.community_posts
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM community_members cm WHERE cm.community_id = community_posts.community_id 
    AND cm.user_id = auth.uid() AND cm.status = 'active'
  ));

CREATE POLICY "Community members can create posts" ON public.community_posts
  FOR INSERT WITH CHECK (auth.uid() = author_id AND EXISTS (
    SELECT 1 FROM community_members cm WHERE cm.community_id = community_posts.community_id 
    AND cm.user_id = auth.uid() AND cm.status = 'active'
  ));

CREATE POLICY "Authors can manage their posts" ON public.community_posts
  FOR ALL USING (auth.uid() = author_id);

CREATE POLICY "Creators can manage their fan events" ON public.fan_events
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Everyone can view upcoming events" ON public.fan_events
  FOR SELECT USING (status = 'upcoming');

CREATE POLICY "Users can manage their event attendance" ON public.event_attendees
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Event creators can view attendees" ON public.event_attendees
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM fan_events fe WHERE fe.id = event_id AND fe.creator_id = auth.uid()
  ));

-- RLS Policies for Business Development Features
CREATE POLICY "Creators can manage their brand partnerships" ON public.brand_partnerships
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Users can view sponsorship campaigns for their partnerships" ON public.sponsorship_campaigns
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM brand_partnerships bp WHERE bp.id = partnership_id AND bp.creator_id = auth.uid()
  ));

CREATE POLICY "Users can manage sponsorship campaigns for their partnerships" ON public.sponsorship_campaigns
  FOR ALL USING (EXISTS (
    SELECT 1 FROM brand_partnerships bp WHERE bp.id = partnership_id AND bp.creator_id = auth.uid()
  ));

CREATE POLICY "Creators can manage their media kits" ON public.media_kits
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Everyone can view public media kits" ON public.media_kits
  FOR SELECT USING (is_public = true);