-- Drop the conflicting cover photo policies and recreate them with proper precedence
DROP POLICY IF EXISTS "Users can upload their own cover photos" ON storage.objects;
DROP POLICY IF EXISTS "Cover photos are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own cover photos" ON storage.objects;

-- Update the general posts policy to exclude covers folder
DROP POLICY IF EXISTS "Users can upload their own posts" ON storage.objects;
CREATE POLICY "Users can upload their own posts" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'posts' 
  AND (storage.foldername(name))[1] != 'covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Now recreate cover photo policies
CREATE POLICY "Users can upload cover photos" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'posts' 
  AND (storage.foldername(name))[1] = 'covers'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

CREATE POLICY "Cover photos are publicly accessible" ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'posts' 
  AND (storage.foldername(name))[1] = 'covers'
);

CREATE POLICY "Users can update cover photos" ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'posts' 
  AND (storage.foldername(name))[1] = 'covers'
  AND auth.uid()::text = (storage.foldername(name))[2]
);