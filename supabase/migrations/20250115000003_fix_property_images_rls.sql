-- Fix RLS policy for property image uploads
-- The current INSERT policy doesn't match the file path structure expected by UPDATE/DELETE policies

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;

-- Create a new INSERT policy that matches the file path structure
CREATE POLICY "Users can upload property images to their own folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.uid() IS NOT NULL 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Also ensure the bucket exists (in case it was deleted)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;
