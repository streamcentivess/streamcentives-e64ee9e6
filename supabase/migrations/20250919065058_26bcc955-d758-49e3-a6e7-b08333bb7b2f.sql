-- Update the follows table RLS policy to allow brand owners to add supporters
-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can follow others" ON follows;

-- Create a new policy that allows both:
-- 1. Users to follow others themselves
-- 2. Brand owners to add supporters (followers)
CREATE POLICY "Users can create follow relationships" ON follows
FOR INSERT 
WITH CHECK (
  -- Allow users to follow others themselves
  (auth.uid() = follower_id AND follower_id <> following_id)
  OR
  -- Allow brand owners to add supporters (people following them)
  (auth.uid() = following_id AND follower_id <> following_id)
);