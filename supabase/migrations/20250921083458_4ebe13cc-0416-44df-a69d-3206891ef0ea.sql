-- Fix storage policies for property uploads
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property videos" ON storage.objects;
DROP POLICY IF EXISTS "Property images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Property videos are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own property videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own property videos" ON storage.objects;

-- Create clean, simple policies for property image uploads
CREATE POLICY "Anyone can view property images" ON storage.objects
FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own property images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own property images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create clean, simple policies for property video uploads
CREATE POLICY "Anyone can view property videos" ON storage.objects
FOR SELECT USING (bucket_id = 'property-videos');

CREATE POLICY "Authenticated users can upload property videos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'property-videos' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own property videos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'property-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own property videos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'property-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);