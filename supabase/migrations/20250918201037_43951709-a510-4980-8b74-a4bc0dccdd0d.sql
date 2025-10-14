-- First, drop all existing storage policies for property buckets to avoid conflicts
DROP POLICY IF EXISTS "Users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload property videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can view property videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own property videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own property videos" ON storage.objects;

-- Create comprehensive storage policies for property-images bucket
CREATE POLICY "authenticated_users_can_upload_property_images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "everyone_can_view_property_images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-images');

CREATE POLICY "authenticated_users_can_update_property_images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'property-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "authenticated_users_can_delete_property_images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'property-images' 
  AND auth.uid() IS NOT NULL
);

-- Create comprehensive storage policies for property-videos bucket
CREATE POLICY "authenticated_users_can_upload_property_videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'property-videos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "everyone_can_view_property_videos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-videos');

CREATE POLICY "authenticated_users_can_update_property_videos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'property-videos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "authenticated_users_can_delete_property_videos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'property-videos' 
  AND auth.uid() IS NOT NULL
);

-- Fix requirements table RLS policy
DROP POLICY IF EXISTS "Users can create requirements" ON public.requirements;

CREATE POLICY "authenticated_users_can_create_requirements" 
ON public.requirements 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND auth.uid() IS NOT NULL
);