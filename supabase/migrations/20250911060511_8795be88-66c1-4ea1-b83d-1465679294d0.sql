-- Drop existing storage policies to recreate them
DROP POLICY IF EXISTS "Society owners can view their documents" ON storage.objects;
DROP POLICY IF EXISTS "Society owners can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Society members can view society documents" ON storage.objects;

-- Create storage policies for society documents
CREATE POLICY "Society owners can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'society-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Society owners can view documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'society-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Society members can view documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'society-documents' AND
  EXISTS (
    SELECT 1 FROM society_members sm
    JOIN societies s ON s.id = sm.society_id
    WHERE s.society_code = (storage.foldername(name))[2]
    AND sm.user_id = auth.uid()
  )
);