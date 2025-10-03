-- Story Highlights: Collections of saved stories
CREATE TABLE IF NOT EXISTS public.story_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 50)
);

-- Items within highlights
CREATE TABLE IF NOT EXISTS public.story_highlight_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  highlight_id UUID NOT NULL REFERENCES public.story_highlights(id) ON DELETE CASCADE,
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(highlight_id, story_id)
);

-- Stream Recordings (VOD)
CREATE TABLE IF NOT EXISTS public.stream_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  recording_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  view_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  CONSTRAINT recording_url_required CHECK (char_length(recording_url) > 0)
);

-- Story Replies (DMs from stories)
CREATE TABLE IF NOT EXISTS public.story_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT message_length CHECK (char_length(message) >= 1 AND char_length(message) <= 500)
);

-- Stream Analytics
CREATE TABLE IF NOT EXISTS public.stream_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  average_watch_time_seconds INTEGER DEFAULT 0,
  total_gifts_received INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  total_chat_messages INTEGER DEFAULT 0,
  new_followers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(stream_id, date)
);

-- Enable RLS
ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_highlight_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stream_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for story_highlights
CREATE POLICY "Users can manage their own highlights"
  ON public.story_highlights FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Everyone can view public highlights"
  ON public.story_highlights FOR SELECT
  USING (true);

-- RLS Policies for story_highlight_items
CREATE POLICY "Users can manage their highlight items"
  ON public.story_highlight_items FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.story_highlights
    WHERE story_highlights.id = story_highlight_items.highlight_id
    AND story_highlights.creator_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.story_highlights
    WHERE story_highlights.id = story_highlight_items.highlight_id
    AND story_highlights.creator_id = auth.uid()
  ));

CREATE POLICY "Everyone can view highlight items"
  ON public.story_highlight_items FOR SELECT
  USING (true);

-- RLS Policies for stream_recordings
CREATE POLICY "Creators can manage their recordings"
  ON public.stream_recordings FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Everyone can view public recordings"
  ON public.stream_recordings FOR SELECT
  USING (is_public = true OR auth.uid() = creator_id);

-- RLS Policies for story_replies
CREATE POLICY "Users can send story replies"
  ON public.story_replies FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view replies they sent or received"
  ON public.story_replies FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Recipients can update read status"
  ON public.story_replies FOR UPDATE
  USING (auth.uid() = recipient_id);

-- RLS Policies for stream_analytics
CREATE POLICY "Creators can view their analytics"
  ON public.stream_analytics FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "System can manage analytics"
  ON public.stream_analytics FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX idx_story_highlights_creator_id ON public.story_highlights(creator_id);
CREATE INDEX idx_story_highlight_items_highlight_id ON public.story_highlight_items(highlight_id);
CREATE INDEX idx_stream_recordings_creator_id ON public.stream_recordings(creator_id);
CREATE INDEX idx_stream_recordings_stream_id ON public.stream_recordings(stream_id);
CREATE INDEX idx_story_replies_story_id ON public.story_replies(story_id);
CREATE INDEX idx_story_replies_sender_id ON public.story_replies(sender_id);
CREATE INDEX idx_story_replies_recipient_id ON public.story_replies(recipient_id);
CREATE INDEX idx_stream_analytics_stream_id ON public.stream_analytics(stream_id);
CREATE INDEX idx_stream_analytics_creator_id ON public.stream_analytics(creator_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.story_replies;