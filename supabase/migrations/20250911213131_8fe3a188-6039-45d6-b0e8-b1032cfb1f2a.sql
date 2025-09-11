-- Create tables for AI generated content and content boosts

-- Table for storing AI-generated content
CREATE TABLE IF NOT EXISTS public.ai_generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'text', 'video_idea', 'story_idea', 'text_post', 'image_concept')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  download_url TEXT,
  hashtags TEXT[],
  engagement_tip TEXT,
  viral_potential INTEGER CHECK (viral_potential >= 1 AND viral_potential <= 10),
  boost_applied BOOLEAN DEFAULT false,
  boost_multiplier DECIMAL DEFAULT 1.0,
  boost_expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table for tracking content boosts
CREATE TABLE IF NOT EXISTS public.content_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL,
  user_id UUID NOT NULL,
  boost_type TEXT NOT NULL DEFAULT 'creator_pro',
  boost_multiplier DECIMAL NOT NULL DEFAULT 2.5,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add boost-related columns to posts table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'boost_multiplier') THEN
    ALTER TABLE public.posts ADD COLUMN boost_multiplier DECIMAL DEFAULT 1.0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'boost_expires_at') THEN
    ALTER TABLE public.posts ADD COLUMN boost_expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'is_boosted') THEN
    ALTER TABLE public.posts ADD COLUMN is_boosted BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'boost_type') THEN
    ALTER TABLE public.posts ADD COLUMN boost_type TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'carousel_urls') THEN
    ALTER TABLE public.posts ADD COLUMN carousel_urls TEXT[];
  END IF;
END $$;

-- Enable RLS on new tables
ALTER TABLE public.ai_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_boosts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_generated_content
CREATE POLICY "Users can manage their own AI content" 
ON public.ai_generated_content 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for content_boosts
CREATE POLICY "Users can view their own content boosts" 
ON public.content_boosts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can manage content boosts" 
ON public.content_boosts 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_user_id ON public.ai_generated_content(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_type ON public.ai_generated_content(type);
CREATE INDEX IF NOT EXISTS idx_ai_generated_content_created_at ON public.ai_generated_content(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_boosts_user_id ON public.content_boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_content_boosts_content_id ON public.content_boosts(content_id);
CREATE INDEX IF NOT EXISTS idx_content_boosts_expires_at ON public.content_boosts(expires_at);
CREATE INDEX IF NOT EXISTS idx_content_boosts_active ON public.content_boosts(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_posts_boosted ON public.posts(is_boosted) WHERE is_boosted = true;
CREATE INDEX IF NOT EXISTS idx_posts_boost_expires ON public.posts(boost_expires_at);

-- Create trigger for updating updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to tables that need updated_at maintenance
DROP TRIGGER IF EXISTS update_ai_generated_content_updated_at ON public.ai_generated_content;
CREATE TRIGGER update_ai_generated_content_updated_at
    BEFORE UPDATE ON public.ai_generated_content
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();