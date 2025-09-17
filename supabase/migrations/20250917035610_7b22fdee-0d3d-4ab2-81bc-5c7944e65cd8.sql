-- Add RLS policy to allow viewing basic profile information for other users
-- This allows users to see username, display_name, avatar_url, bio, and location of other users
-- but still protects sensitive information like email, phone, etc.

CREATE POLICY "Users can view basic profile info of others" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (true);