-- Remove the incorrect foreign key constraint that references community_posts
ALTER TABLE post_comments 
DROP CONSTRAINT IF EXISTS fk_post_comments_post_id;

-- Verify that post_comments.post_id correctly references posts.id
-- The existing post_comments_post_id_fkey constraint should remain