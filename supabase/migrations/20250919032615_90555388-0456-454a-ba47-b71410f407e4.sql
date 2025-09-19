-- Create sponsor-logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('sponsor-logos', 'sponsor-logos', true);

-- Create RLS policies for sponsor-logos bucket
CREATE POLICY "Sponsors can upload their own logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'sponsor-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Sponsor logos are publicly viewable"
ON storage.objects FOR SELECT
USING (bucket_id = 'sponsor-logos');

CREATE POLICY "Sponsors can update their own logos"  
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'sponsor-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Sponsors can delete their own logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'sponsor-logos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);