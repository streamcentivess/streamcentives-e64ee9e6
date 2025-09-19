-- Fix storage policy to allow uploads under community-posts/{user_id}/...
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can upload community media'
  ) THEN
    DROP POLICY "Users can upload community media" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can update their own community media'
  ) THEN
    DROP POLICY "Users can update their own community media" ON storage.objects;
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Users can delete their own community media'
  ) THEN
    DROP POLICY "Users can delete their own community media" ON storage.objects;
  END IF;
END $$;

-- Recreate policies with second folder segment matching user id
CREATE POLICY "Users can upload community media" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'community-media' 
  AND auth.uid()::text = COALESCE((storage.foldername(name))[2], '')
);

CREATE POLICY "Users can update their own community media" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'community-media' 
  AND auth.uid()::text = COALESCE((storage.foldername(name))[2], '')
);

CREATE POLICY "Users can delete their own community media" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'community-media' 
  AND auth.uid()::text = COALESCE((storage.foldername(name))[2], '')
);