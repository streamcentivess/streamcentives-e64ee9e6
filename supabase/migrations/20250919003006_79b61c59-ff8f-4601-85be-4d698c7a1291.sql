-- Create storage bucket for sponsor contracts
INSERT INTO storage.buckets (id, name, public) 
VALUES ('sponsor-contracts', 'sponsor-contracts', false);

-- Create RLS policies for sponsor contracts bucket
CREATE POLICY "Sponsors can upload their own contracts" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'sponsor-contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Sponsors can view their own contracts" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'sponsor-contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Creators can view contracts in offers sent to them" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'sponsor-contracts' 
  AND EXISTS (
    SELECT 1 FROM sponsor_offers so 
    WHERE so.creator_id = auth.uid() 
    AND storage.filename(name) IN (
      SELECT unnest(string_to_array(so.terms, ','))
    )
  )
);