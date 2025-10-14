-- Add videos column to properties table
ALTER TABLE public.properties 
ADD COLUMN videos TEXT[] DEFAULT '{}';

-- Create videos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('property-videos', 'property-videos', true, 104857600, ARRAY['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm']);

-- Create storage policies for property videos
CREATE POLICY "Property videos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'property-videos');

CREATE POLICY "Users can upload property videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'property-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their property videos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'property-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their property videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'property-videos' AND auth.uid()::text = (storage.foldername(name))[1]);