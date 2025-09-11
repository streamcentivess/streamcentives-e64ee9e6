-- Fix post_likes RLS policies for proper authentication
DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON public.post_likes;

-- Create proper INSERT policy for liking posts
CREATE POLICY "Users can like posts" 
ON public.post_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create proper DELETE policy for unliking posts
CREATE POLICY "Users can unlike posts" 
ON public.post_likes 
FOR DELETE 
USING (auth.uid() = user_id);