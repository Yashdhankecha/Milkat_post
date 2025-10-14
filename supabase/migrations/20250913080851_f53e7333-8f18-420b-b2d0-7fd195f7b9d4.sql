-- Drop all incorrect policies one more time
DROP POLICY IF EXISTS "Society owners can upload documents to their society folder" ON storage.objects;
DROP POLICY IF EXISTS "Society owners can view documents in their society folder" ON storage.objects;
DROP POLICY IF EXISTS "Society owners can update documents in their society folder" ON storage.objects;
DROP POLICY IF EXISTS "Society owners can delete documents from their society folder" ON storage.objects;

-- Create TRULY CORRECT policies that check the file path (storage.objects.name) starts with society ID
CREATE POLICY "Society owners can upload documents to their society folder" 
ON storage.objects 
FOR INSERT 
TO public 
WITH CHECK (
  bucket_id = 'society-documents' AND 
  EXISTS (
    SELECT 1 FROM societies 
    WHERE societies.owner_id = auth.uid() 
    AND name LIKE societies.id::text || '%'
  )
);

CREATE POLICY "Society owners can view documents in their society folder" 
ON storage.objects 
FOR SELECT 
TO public 
USING (
  bucket_id = 'society-documents' AND 
  EXISTS (
    SELECT 1 FROM societies 
    WHERE societies.owner_id = auth.uid() 
    AND name LIKE societies.id::text || '%'
  )
);

CREATE POLICY "Society owners can update documents in their society folder" 
ON storage.objects 
FOR UPDATE 
TO public 
USING (
  bucket_id = 'society-documents' AND 
  EXISTS (
    SELECT 1 FROM societies 
    WHERE societies.owner_id = auth.uid() 
    AND name LIKE societies.id::text || '%'
  )
);

CREATE POLICY "Society owners can delete documents from their society folder" 
ON storage.objects 
FOR DELETE 
TO public 
USING (
  bucket_id = 'society-documents' AND 
  EXISTS (
    SELECT 1 FROM societies 
    WHERE societies.owner_id = auth.uid() 
    AND name LIKE societies.id::text || '%'
  )
);