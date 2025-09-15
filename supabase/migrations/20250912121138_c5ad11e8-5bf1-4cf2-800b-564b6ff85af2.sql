-- Check existing storage policies for society-documents bucket
SELECT * FROM storage.objects WHERE bucket_id = 'society-documents' LIMIT 1;

-- Create storage policies for society-documents bucket to allow society owners to upload
CREATE POLICY "Society owners can upload their documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'society-documents' 
  AND EXISTS (
    SELECT 1 FROM societies 
    WHERE societies.owner_id = auth.uid()
  )
);

CREATE POLICY "Society owners can view their documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'society-documents' 
  AND EXISTS (
    SELECT 1 FROM societies 
    WHERE societies.owner_id = auth.uid()
  )
);

CREATE POLICY "Society owners can update their documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'society-documents' 
  AND EXISTS (
    SELECT 1 FROM societies 
    WHERE societies.owner_id = auth.uid()
  )
);

CREATE POLICY "Society owners can delete their documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'society-documents' 
  AND EXISTS (
    SELECT 1 FROM societies 
    WHERE societies.owner_id = auth.uid()
  )
);