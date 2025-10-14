-- Clean up all storage policies and recreate them properly
-- Drop all existing storage policies
DROP POLICY IF EXISTS "Admins can access all society documents" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Property videos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Society members can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Society owners can delete documents from their society folder" ON storage.objects;
DROP POLICY IF EXISTS "Society owners can update documents in their society folder" ON storage.objects;
DROP POLICY IF EXISTS "Society owners can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Society owners can upload documents to their society folder" ON storage.objects;
DROP POLICY IF EXISTS "Society owners can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Society owners can view documents in their society folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their property videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their property videos" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_delete_property_images" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_delete_property_videos" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_update_property_images" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_update_property_videos" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_upload_property_images" ON storage.objects;
DROP POLICY IF EXISTS "authenticated_users_can_upload_property_videos" ON storage.objects;
DROP POLICY IF EXISTS "everyone_can_view_property_images" ON storage.objects;
DROP POLICY IF EXISTS "everyone_can_view_property_videos" ON storage.objects;

-- Create simple, clean policies for property images
CREATE POLICY "property_images_public_view" ON storage.objects
FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "property_images_authenticated_upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "property_images_owner_manage" ON storage.objects
FOR ALL USING (
  bucket_id = 'property-images' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create simple, clean policies for property videos
CREATE POLICY "property_videos_public_view" ON storage.objects
FOR SELECT USING (bucket_id = 'property-videos');

CREATE POLICY "property_videos_authenticated_upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'property-videos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "property_videos_owner_manage" ON storage.objects
FOR ALL USING (
  bucket_id = 'property-videos' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create simple policies for society documents
CREATE POLICY "society_documents_public_view" ON storage.objects
FOR SELECT USING (bucket_id = 'society-documents');

CREATE POLICY "society_documents_authenticated_upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'society-documents' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "society_documents_owner_manage" ON storage.objects
FOR ALL USING (
  bucket_id = 'society-documents' 
  AND auth.uid() IS NOT NULL
  AND auth.uid()::text = (storage.foldername(name))[1]
);