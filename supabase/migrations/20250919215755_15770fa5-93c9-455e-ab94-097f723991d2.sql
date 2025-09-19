-- Clean up orphaned records and add foreign key relationships

-- Remove orphaned post_comments that don't have matching community_posts
DELETE FROM public.post_comments 
WHERE post_id NOT IN (SELECT id FROM public.community_posts);

-- Add foreign key from community_messages to profiles
ALTER TABLE public.community_messages 
ADD CONSTRAINT fk_community_messages_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Add foreign key from post_comments to community_posts
ALTER TABLE public.post_comments 
ADD CONSTRAINT fk_post_comments_post_id 
FOREIGN KEY (post_id) REFERENCES public.community_posts(id) 
ON DELETE CASCADE;

-- Add foreign key from post_comments to profiles
ALTER TABLE public.post_comments 
ADD CONSTRAINT fk_post_comments_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Add foreign key from community_posts to profiles
ALTER TABLE public.community_posts 
ADD CONSTRAINT fk_community_posts_author_id 
FOREIGN KEY (author_id) REFERENCES public.profiles(user_id) 
ON DELETE CASCADE;

-- Enable realtime for community_messages table
ALTER TABLE public.community_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;