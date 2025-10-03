-- Phase 1: Fix post_comments RLS and add live streaming tables

-- Ensure post_comments has proper foreign key (may already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'post_comments_post_id_fkey'
  ) THEN
    ALTER TABLE public.post_comments
    ADD CONSTRAINT post_comments_post_id_fkey
    FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Phase 3: Live Streaming Tables
CREATE TABLE IF NOT EXISTS public.live_streams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  stream_key TEXT NOT NULL UNIQUE,
  rtmp_url TEXT,
  hls_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  viewer_count INTEGER DEFAULT 0,
  peak_viewer_count INTEGER DEFAULT 0,
  total_gifts_received INTEGER DEFAULT 0,
  total_xp_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.live_stream_gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gift_type TEXT NOT NULL,
  gift_value_xp INTEGER NOT NULL,
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.live_stream_viewers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  left_at TIMESTAMPTZ,
  total_watch_time_seconds INTEGER DEFAULT 0,
  UNIQUE(stream_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.gift_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon_name TEXT NOT NULL,
  xp_cost INTEGER NOT NULL,
  animation_type TEXT NOT NULL,
  creator_type TEXT NOT NULL,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_streams
CREATE POLICY "Live streams are publicly viewable"
  ON public.live_streams FOR SELECT
  USING (true);

CREATE POLICY "Creators can manage their own streams"
  ON public.live_streams FOR ALL
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- RLS Policies for live_stream_gifts
CREATE POLICY "Users can send gifts"
  ON public.live_stream_gifts FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Stream participants can view gifts"
  ON public.live_stream_gifts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.live_streams
      WHERE id = stream_id AND (creator_id = auth.uid() OR status = 'live')
    )
  );

-- RLS Policies for live_stream_viewers
CREATE POLICY "Users can track their own viewing"
  ON public.live_stream_viewers FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Creators can view their stream viewers"
  ON public.live_stream_viewers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.live_streams
      WHERE id = stream_id AND creator_id = auth.uid()
    )
  );

-- RLS Policies for gift_types
CREATE POLICY "Gift types are publicly viewable"
  ON public.gift_types FOR SELECT
  USING (true);

-- Insert gift types for each creator type
INSERT INTO public.gift_types (name, icon_name, xp_cost, animation_type, creator_type, rarity) VALUES
-- Music Creator Gifts
('Microphone', 'Mic', 50, 'float', 'music', 'common'),
('Music Note', 'Music', 100, 'sparkle', 'music', 'common'),
('Guitar', 'Guitar', 250, 'spin', 'music', 'rare'),
('Drums', 'Drum', 500, 'pulse', 'music', 'epic'),
('Golden Vinyl', 'Disc', 1000, 'rainbow', 'music', 'legendary'),

-- Fitness Creator Gifts
('Running Shoe', 'Footprints', 50, 'float', 'fitness', 'common'),
('Dumbbell', 'Dumbbell', 100, 'sparkle', 'fitness', 'common'),
('Jump Rope', 'Activity', 250, 'spin', 'fitness', 'rare'),
('Trophy', 'Trophy', 500, 'pulse', 'fitness', 'epic'),
('Golden Medal', 'Medal', 1000, 'rainbow', 'fitness', 'legendary'),

-- Gaming Creator Gifts
('Controller', 'Gamepad2', 50, 'float', 'gaming', 'common'),
('Keyboard', 'Keyboard', 100, 'sparkle', 'gaming', 'common'),
('Headset', 'Headphones', 250, 'spin', 'gaming', 'rare'),
('Victory Cup', 'Trophy', 500, 'pulse', 'gaming', 'epic'),
('Legendary Sword', 'Sword', 1000, 'rainbow', 'gaming', 'legendary'),

-- Art Creator Gifts
('Paint Brush', 'Paintbrush', 50, 'float', 'art', 'common'),
('Palette', 'Palette', 100, 'sparkle', 'art', 'common'),
('Camera', 'Camera', 250, 'spin', 'art', 'rare'),
('Golden Frame', 'Frame', 500, 'pulse', 'art', 'epic'),
('Masterpiece', 'Sparkles', 1000, 'rainbow', 'art', 'legendary'),

-- Fashion Creator Gifts
('Lipstick', 'Sparkles', 50, 'float', 'fashion', 'common'),
('Sunglasses', 'Sun', 100, 'sparkle', 'fashion', 'common'),
('Crown', 'Crown', 250, 'spin', 'fashion', 'rare'),
('Diamond Ring', 'Gem', 500, 'pulse', 'fashion', 'epic'),
('Haute Couture', 'Sparkles', 1000, 'rainbow', 'fashion', 'legendary'),

-- Food Creator Gifts
('Chef Hat', 'ChefHat', 50, 'float', 'food', 'common'),
('Cupcake', 'Cake', 100, 'sparkle', 'food', 'common'),
('Sushi', 'UtensilsCrossed', 250, 'spin', 'food', 'rare'),
('Golden Platter', 'Star', 500, 'pulse', 'food', 'epic'),
('Michelin Star', 'Star', 1000, 'rainbow', 'food', 'legendary')

ON CONFLICT DO NOTHING;

-- Add realtime for live streaming
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream_gifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream_viewers;