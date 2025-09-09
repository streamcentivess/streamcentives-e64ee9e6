-- Create posts table for user content
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('image', 'video')),
  content_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_likes table
CREATE TABLE public.post_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Create post_comments table
CREATE TABLE public.post_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for posts
CREATE POLICY "Users can create their own posts" 
ON public.posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts" 
ON public.posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" 
ON public.posts 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Posts are publicly viewable" 
ON public.posts 
FOR SELECT 
USING (true);

-- RLS Policies for post_likes
CREATE POLICY "Users can like posts" 
ON public.post_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" 
ON public.post_likes 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Likes are publicly viewable" 
ON public.post_likes 
FOR SELECT 
USING (true);

-- RLS Policies for post_comments
CREATE POLICY "Users can create comments" 
ON public.post_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON public.post_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON public.post_comments 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Comments are publicly viewable" 
ON public.post_comments 
FOR SELECT 
USING (true);

-- Create storage bucket for posts
INSERT INTO storage.buckets (id, name, public) VALUES ('posts', 'posts', true);

-- Create storage policies for posts
CREATE POLICY "Users can upload their own posts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Posts are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'posts');

CREATE POLICY "Users can update their own posts" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own posts" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'posts' AND auth.uid()::text = (storage.foldername(name))[1]);