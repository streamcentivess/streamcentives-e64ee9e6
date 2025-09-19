-- Create RLS policies for sponsor-logos bucket (if they don't exist)
DO $$
BEGIN
  -- Create upload policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Sponsors can upload their own logos'
  ) THEN
    CREATE POLICY "Sponsors can upload their own logos"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'sponsor-logos' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- Create select policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Sponsor logos are publicly viewable'
  ) THEN
    CREATE POLICY "Sponsor logos are publicly viewable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'sponsor-logos');
  END IF;

  -- Create update policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Sponsors can update their own logos'
  ) THEN
    CREATE POLICY "Sponsors can update their own logos"  
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'sponsor-logos' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- Create delete policy if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Sponsors can delete their own logos'
  ) THEN
    CREATE POLICY "Sponsors can delete their own logos"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'sponsor-logos' 
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END
$$;