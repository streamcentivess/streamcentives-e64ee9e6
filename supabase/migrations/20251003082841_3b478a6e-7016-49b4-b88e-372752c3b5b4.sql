-- Create storage buckets for stories and live thumbnails and add RLS policies
-- Postgres policies don't support IF NOT EXISTS, so we need to use DO blocks

-- 1) Create buckets
insert into storage.buckets (id, name, public)
values 
  ('stories', 'stories', true),
  ('live-thumbnails', 'live-thumbnails', true)
on conflict (id) do nothing;

-- 2) Drop existing policies if they exist and recreate
DO $$
BEGIN
  DROP POLICY IF EXISTS "Public can view stories media" ON storage.objects;
  DROP POLICY IF EXISTS "Public can view live thumbnails" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload their own story media" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own story media" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own story media" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload their own live thumbnails" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own live thumbnails" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own live thumbnails" ON storage.objects;
END $$;

-- 3) Create policies for public read access
CREATE POLICY "Public can view stories media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'stories');

CREATE POLICY "Public can view live thumbnails"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'live-thumbnails');

-- 4) Authenticated users can manage their own files
CREATE POLICY "Users can upload their own story media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own story media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own story media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'stories' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own live thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'live-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own live thumbnails"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'live-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own live thumbnails"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'live-thumbnails' AND auth.uid()::text = (storage.foldername(name))[1]
  );