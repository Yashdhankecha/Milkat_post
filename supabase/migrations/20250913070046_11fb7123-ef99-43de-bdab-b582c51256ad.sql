-- Drop existing policies that are too broad
DROP POLICY IF EXISTS "Society owners can upload their documents" ON storage.objects;
DROP POLICY IF EXISTS "Society owners can view their documents" ON storage.objects;
DROP POLICY IF EXISTS "Society owners can update their documents" ON storage.objects;
DROP POLICY IF EXISTS "Society owners can delete their documents" ON storage.objects;

-- Create more specific storage policies for society-documents bucket
-- These policies check that the file path starts with the society ID owned by the user

CREATE POLICY "Society owners can upload documents to their society folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'society-documents' 
  AND EXISTS (
    SELECT 1 FROM societies 
    WHERE societies.owner_id = auth.uid()
    AND (storage.foldername(name))[1] = societies.id::text
  )
);

CREATE POLICY "Society owners can view documents in their society folder" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'society-documents' 
  AND EXISTS (
    SELECT 1 FROM societies 
    WHERE societies.owner_id = auth.uid()
    AND (storage.foldername(name))[1] = societies.id::text
  )
);

CREATE POLICY "Society owners can update documents in their society folder" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'society-documents' 
  AND EXISTS (
    SELECT 1 FROM societies 
    WHERE societies.owner_id = auth.uid()
    AND (storage.foldername(name))[1] = societies.id::text
  )
);

CREATE POLICY "Society owners can delete documents from their society folder" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'society-documents' 
  AND EXISTS (
    SELECT 1 FROM societies 
    WHERE societies.owner_id = auth.uid()
    AND (storage.foldername(name))[1] = societies.id::text
  )
);