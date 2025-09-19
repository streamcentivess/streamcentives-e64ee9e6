-- Add missing foreign key constraints for community_posts table

-- Add foreign key constraint to communities table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'community_posts_community_id_fkey' 
    AND table_name = 'community_posts'
  ) THEN
    ALTER TABLE public.community_posts 
    ADD CONSTRAINT community_posts_community_id_fkey 
    FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint to profiles table for author_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'community_posts_author_id_fkey' 
    AND table_name = 'community_posts'
  ) THEN
    ALTER TABLE public.community_posts 
    ADD CONSTRAINT community_posts_author_id_fkey 
    FOREIGN KEY (author_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
  END IF;
END $$;

-- Enable realtime for community_posts table
ALTER TABLE public.community_posts REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;