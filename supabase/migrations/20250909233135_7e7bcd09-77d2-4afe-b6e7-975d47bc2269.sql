-- Add fields to posts table to support community feed functionality
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS is_community_post BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_cross_posted BOOLEAN DEFAULT false;

-- Create index for better performance on community posts
CREATE INDEX IF NOT EXISTS idx_posts_community ON public.posts(is_community_post, created_at DESC);

-- Update existing posts to be community posts (since they're already showing in feed)
UPDATE public.posts SET is_community_post = true WHERE is_community_post IS NULL OR is_community_post = false;