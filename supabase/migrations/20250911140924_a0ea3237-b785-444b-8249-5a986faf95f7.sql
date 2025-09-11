-- Create storage policies for cover photos in the posts bucket
-- Allow users to upload their own cover photos
CREATE POLICY "Users can upload their own cover photos" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'posts' 
  AND (storage.foldername(name))[1] = 'covers'
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow users to view cover photos (public access)
CREATE POLICY "Cover photos are publicly viewable" ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'posts' 
  AND (storage.foldername(name))[1] = 'covers'
);

-- Allow users to update their own cover photos
CREATE POLICY "Users can update their own cover photos" ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'posts' 
  AND (storage.foldername(name))[1] = 'covers'
  AND auth.uid()::text = (storage.foldername(name))[2]
);