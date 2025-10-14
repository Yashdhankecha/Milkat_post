-- Rollback storage policies to original state

-- Drop all new policies created today
DROP POLICY IF EXISTS "property_images_public_view" ON storage.objects;
DROP POLICY IF EXISTS "property_images_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "property_images_owner_manage" ON storage.objects;
DROP POLICY IF EXISTS "property_videos_public_view" ON storage.objects;
DROP POLICY IF EXISTS "property_videos_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "property_videos_owner_manage" ON storage.objects;
DROP POLICY IF EXISTS "society_documents_public_view" ON storage.objects;
DROP POLICY IF EXISTS "society_documents_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "society_documents_owner_manage" ON storage.objects;

-- Restore original policies from before today's changes
CREATE POLICY "Property images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can upload their own property images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own property images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Note: Add any other original storage policies that were replaced today