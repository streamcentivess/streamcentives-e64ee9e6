-- Create tables for the strategic pivot features

-- Smart Links table to track all creator smart links
CREATE TABLE public.smart_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  total_clicks INTEGER DEFAULT 0,
  total_xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Smart Link Actions - what actions are available on each smart link
CREATE TABLE public.smart_link_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  smart_link_id UUID NOT NULL REFERENCES public.smart_links(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'spotify_save', 'youtube_subscribe', 'follow_instagram', etc.
  action_label TEXT NOT NULL,
  action_url TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 10,
  bonus_multiplier NUMERIC DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Track user interactions with smart links
CREATE TABLE public.smart_link_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  smart_link_id UUID NOT NULL REFERENCES public.smart_links(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_id UUID REFERENCES public.smart_link_actions(id) ON DELETE SET NULL,
  interaction_type TEXT NOT NULL, -- 'click', 'action_complete'
  xp_earned INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(smart_link_id, user_id, action_id) -- Prevent duplicate actions
);

-- Artist Initiation Quests
CREATE TABLE public.artist_initiation_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quest_name TEXT NOT NULL,
  description TEXT,
  total_xp_reward INTEGER NOT NULL DEFAULT 100,
  bonus_xp_reward INTEGER DEFAULT 50, -- Bonus for completing all steps
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Quest Steps
CREATE TABLE public.quest_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES public.artist_initiation_quests(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_title TEXT NOT NULL,
  step_description TEXT,
  action_type TEXT NOT NULL, -- 'stream_songs', 'watch_video', 'follow_artist', 'save_playlist'
  action_data JSONB NOT NULL DEFAULT '{}', -- URLs, song IDs, etc.
  xp_reward INTEGER NOT NULL DEFAULT 20,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User Quest Progress
CREATE TABLE public.user_quest_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id UUID NOT NULL REFERENCES public.artist_initiation_quests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.quest_steps(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  xp_earned INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  UNIQUE(quest_id, user_id, step_id) -- One completion per step per user
);

-- Discovery Funnel Analytics
CREATE TABLE public.discovery_funnel_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  funnel_stage TEXT NOT NULL, -- 'discover', 'click', 'action', 'fan_convert'
  source_platform TEXT, -- 'tiktok', 'instagram', 'twitter', 'direct'
  content_type TEXT, -- 'smart_link', 'quest', 'campaign'
  content_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.smart_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_link_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_link_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_initiation_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_quest_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discovery_funnel_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Smart Links
-- Creators can manage their own smart links
CREATE POLICY "creators_manage_smart_links" ON public.smart_links
FOR ALL USING (auth.uid() = creator_id);

-- Anyone can view active smart links (for public access)
CREATE POLICY "public_view_active_smart_links" ON public.smart_links
FOR SELECT USING (is_active = true);

-- Smart Link Actions - creators manage, everyone can view
CREATE POLICY "creators_manage_smart_link_actions" ON public.smart_link_actions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.smart_links sl 
    WHERE sl.id = smart_link_actions.smart_link_id 
    AND sl.creator_id = auth.uid()
  )
);

CREATE POLICY "public_view_smart_link_actions" ON public.smart_link_actions
FOR SELECT USING (is_active = true);

-- Smart Link Interactions - users manage their own
CREATE POLICY "users_manage_interactions" ON public.smart_link_interactions
FOR ALL USING (auth.uid() = user_id);

-- Quest policies - creators manage, users can view and participate
CREATE POLICY "creators_manage_quests" ON public.artist_initiation_quests
FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "public_view_active_quests" ON public.artist_initiation_quests
FOR SELECT USING (is_active = true);

CREATE POLICY "creators_manage_quest_steps" ON public.quest_steps
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.artist_initiation_quests q 
    WHERE q.id = quest_steps.quest_id 
    AND q.creator_id = auth.uid()
  )
);

CREATE POLICY "public_view_quest_steps" ON public.quest_steps
FOR SELECT USING (true);

-- User quest progress - users manage their own
CREATE POLICY "users_manage_quest_progress" ON public.user_quest_progress
FOR ALL USING (auth.uid() = user_id);

-- Analytics - creators view their own, system can insert
CREATE POLICY "creators_view_analytics" ON public.discovery_funnel_analytics
FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "system_insert_analytics" ON public.discovery_funnel_analytics
FOR INSERT WITH CHECK (true);

-- Add updated_at triggers
CREATE TRIGGER update_smart_links_updated_at
    BEFORE UPDATE ON public.smart_links
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_artist_initiation_quests_updated_at
    BEFORE UPDATE ON public.artist_initiation_quests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();