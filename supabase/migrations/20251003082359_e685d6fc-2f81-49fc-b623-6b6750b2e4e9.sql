-- =====================================================
-- Phase 1: Stories & Enhanced Live Streaming Schema
-- =====================================================

-- 1. Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0 AND duration_seconds <= 60),
  caption TEXT,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '24 hours')
);

-- 2. Create story_views table
CREATE TABLE IF NOT EXISTS public.story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(story_id, viewer_id)
);

-- 3. Create story_highlights table (for permanent story collections)
CREATE TABLE IF NOT EXISTS public.story_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  cover_image_url TEXT,
  story_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Extend live_streams table with new columns
ALTER TABLE public.live_streams 
ADD COLUMN IF NOT EXISTS is_multi_guest BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_guests INTEGER DEFAULT 6 CHECK (max_guests > 0 AND max_guests <= 6),
ADD COLUMN IF NOT EXISTS guest_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'chat',
ADD COLUMN IF NOT EXISTS privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'followers_only', 'private')),
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 5. Create live_stream_guests table
CREATE TABLE IF NOT EXISTS public.live_stream_guests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  guest_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'joined', 'left', 'removed')),
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(stream_id, guest_id)
);

-- 6. Create live_stream_comments table
CREATE TABLE IF NOT EXISTS public.live_stream_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL CHECK (length(comment_text) > 0 AND length(comment_text) <= 500),
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Create live_stream_invites table
CREATE TABLE IF NOT EXISTS public.live_stream_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(stream_id, invitee_id)
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stories_creator_active ON public.stories(creator_id, is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_expires ON public.stories(expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_story_views_story ON public.story_views(story_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_story_views_viewer ON public.story_views(viewer_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_stream_guests_stream ON public.live_stream_guests(stream_id, status);
CREATE INDEX IF NOT EXISTS idx_live_stream_comments_stream ON public.live_stream_comments(stream_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_live_stream_invites_invitee ON public.live_stream_invites(invitee_id, status);

-- =====================================================
-- RLS Policies
-- =====================================================

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_invites ENABLE ROW LEVEL SECURITY;

-- Stories policies
CREATE POLICY "Anyone can view active stories"
  ON public.stories FOR SELECT
  USING (is_active = true);

CREATE POLICY "Creators can insert their own stories"
  ON public.stories FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own stories"
  ON public.stories FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own stories"
  ON public.stories FOR DELETE
  USING (auth.uid() = creator_id);

-- Story views policies
CREATE POLICY "Anyone can view story views"
  ON public.story_views FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can record story views"
  ON public.story_views FOR INSERT
  WITH CHECK (auth.uid() = viewer_id);

-- Story highlights policies
CREATE POLICY "Anyone can view story highlights"
  ON public.story_highlights FOR SELECT
  USING (true);

CREATE POLICY "Creators can manage their own highlights"
  ON public.story_highlights FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Live stream guests policies
CREATE POLICY "Stream participants can view guests"
  ON public.live_stream_guests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.live_streams
      WHERE id = stream_id AND (creator_id = auth.uid() OR auth.uid() = ANY(ARRAY[guest_id]))
    )
  );

CREATE POLICY "Stream creators can invite guests"
  ON public.live_stream_guests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.live_streams
      WHERE id = stream_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "Stream creators and guests can update guest status"
  ON public.live_stream_guests FOR UPDATE
  USING (
    auth.uid() = guest_id OR 
    EXISTS (
      SELECT 1 FROM public.live_streams
      WHERE id = stream_id AND creator_id = auth.uid()
    )
  );

-- Live stream comments policies
CREATE POLICY "Anyone can view live stream comments"
  ON public.live_stream_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can post comments"
  ON public.live_stream_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.live_stream_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Stream creators can delete any comment"
  ON public.live_stream_comments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.live_streams
      WHERE id = stream_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "Stream creators can pin comments"
  ON public.live_stream_comments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.live_streams
      WHERE id = stream_id AND creator_id = auth.uid()
    )
  );

-- Live stream invites policies
CREATE POLICY "Invitees can view their invites"
  ON public.live_stream_invites FOR SELECT
  USING (auth.uid() = invitee_id);

CREATE POLICY "Stream creators can view invites for their streams"
  ON public.live_stream_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.live_streams
      WHERE id = stream_id AND creator_id = auth.uid()
    )
  );

CREATE POLICY "Stream creators can send invites"
  ON public.live_stream_invites FOR INSERT
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Invitees can respond to invites"
  ON public.live_stream_invites FOR UPDATE
  USING (auth.uid() = invitee_id);

-- =====================================================
-- Triggers & Functions
-- =====================================================

-- Function to increment story view count
CREATE OR REPLACE FUNCTION increment_story_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.stories
  SET view_count = view_count + 1
  WHERE id = NEW.story_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_story_view_increment
  AFTER INSERT ON public.story_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_story_view_count();

-- Function to auto-expire stories after 24 hours
CREATE OR REPLACE FUNCTION expire_old_stories()
RETURNS void AS $$
BEGIN
  UPDATE public.stories
  SET is_active = false
  WHERE expires_at < now() AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify followers when creator posts story
CREATE OR REPLACE FUNCTION notify_followers_story_posted()
RETURNS TRIGGER AS $$
DECLARE
  follower_record RECORD;
  creator_name TEXT;
BEGIN
  -- Get creator name
  SELECT COALESCE(display_name, username, 'Someone')
  INTO creator_name
  FROM public.profiles
  WHERE user_id = NEW.creator_id;

  -- Notify all followers
  FOR follower_record IN
    SELECT follower_id FROM public.follows
    WHERE following_id = NEW.creator_id
  LOOP
    INSERT INTO public.notifications (
      user_id, type, title, message, data, priority
    ) VALUES (
      follower_record.follower_id,
      'story_posted',
      '📸 New Story',
      creator_name || ' posted a new story',
      jsonb_build_object(
        'story_id', NEW.id,
        'creator_id', NEW.creator_id,
        'creator_name', creator_name
      ),
      'normal'
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_story_posted_notify
  AFTER INSERT ON public.stories
  FOR EACH ROW
  EXECUTE FUNCTION notify_followers_story_posted();

-- Function to notify when invited to live stream
CREATE OR REPLACE FUNCTION notify_live_stream_invite()
RETURNS TRIGGER AS $$
DECLARE
  inviter_name TEXT;
  stream_title TEXT;
BEGIN
  -- Get inviter name
  SELECT COALESCE(display_name, username, 'Someone')
  INTO inviter_name
  FROM public.profiles
  WHERE user_id = NEW.inviter_id;

  -- Get stream title
  SELECT title INTO stream_title
  FROM public.live_streams
  WHERE id = NEW.stream_id;

  -- Notify invitee
  INSERT INTO public.notifications (
    user_id, type, title, message, data, priority, action_url
  ) VALUES (
    NEW.invitee_id,
    'live_stream_invite',
    '🎥 Live Stream Invitation',
    inviter_name || ' invited you to join their live stream: ' || COALESCE(stream_title, 'Untitled Stream'),
    jsonb_build_object(
      'invite_id', NEW.id,
      'stream_id', NEW.stream_id,
      'inviter_id', NEW.inviter_id,
      'inviter_name', inviter_name
    ),
    'high',
    '/live/' || NEW.stream_id::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_live_stream_invite_notify
  AFTER INSERT ON public.live_stream_invites
  FOR EACH ROW
  EXECUTE FUNCTION notify_live_stream_invite();