-- Fix storage RLS policies for property-images and property-videos buckets
-- Allow authenticated users to upload their own files

-- Create policy for property-images bucket
CREATE POLICY "Users can upload property images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view property images" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'property-images'
);

CREATE POLICY "Users can update their own property images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'property-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own property images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'property-images' 
  AND auth.uid() IS NOT NULL
);

-- Create policy for property-videos bucket
CREATE POLICY "Users can upload property videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'property-videos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view property videos" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'property-videos'
);

CREATE POLICY "Users can update their own property videos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'property-videos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their own property videos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'property-videos' 
  AND auth.uid() IS NOT NULL
);

-- Fix requirements table RLS policy
-- Drop existing restrictive policy if it exists
DROP POLICY IF EXISTS "Users can create requirements" ON public.requirements;

-- Create new policy that allows authenticated users to insert their own requirements
CREATE POLICY "Users can create requirements" 
ON public.requirements 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND auth.uid() IS NOT NULL
);

-- Ensure the requirements table user_id column is properly set as NOT NULL
ALTER TABLE public.requirements ALTER COLUMN user_id SET NOT NULL;