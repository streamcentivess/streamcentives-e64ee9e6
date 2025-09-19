-- Remove tagged_people column if it exists (it shouldn't be there)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'community_posts' 
    AND column_name = 'tagged_people'
  ) THEN
    ALTER TABLE public.community_posts DROP COLUMN tagged_people;
  END IF;
END $$;

-- Ensure post_tags table exists with proper structure
CREATE TABLE IF NOT EXISTS public.post_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  tagged_user_id UUID NOT NULL,
  tagged_by_user_id UUID NOT NULL,
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tag_type TEXT DEFAULT 'creator'
);

-- Enable RLS on post_tags
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for post_tags if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'post_tags' AND policyname = 'Users can view post tags'
  ) THEN
    CREATE POLICY "Users can view post tags" ON public.post_tags FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'post_tags' AND policyname = 'Users can create post tags'
  ) THEN
    CREATE POLICY "Users can create post tags" ON public.post_tags FOR INSERT WITH CHECK (auth.uid() = tagged_by_user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'post_tags' AND policyname = 'Tagged users can update approval status'
  ) THEN
    CREATE POLICY "Tagged users can update approval status" ON public.post_tags FOR UPDATE USING (auth.uid() = tagged_user_id);
  END IF;
END $$;