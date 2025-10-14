-- Create storage policies for property images and videos
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can view property images"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'property-images');

CREATE POLICY "Property images are publicly viewable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Authenticated users can view property videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'property-videos');

CREATE POLICY "Property videos are publicly viewable"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'property-videos');

CREATE POLICY "Users can update their own property images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own property images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own property videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own property videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-videos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);