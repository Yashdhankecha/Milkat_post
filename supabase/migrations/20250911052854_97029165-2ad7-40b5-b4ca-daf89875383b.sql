-- Create storage bucket for society documents
INSERT INTO storage.buckets (id, name, public) VALUES ('society-documents', 'society-documents', false);

-- Create policies for society document uploads
CREATE POLICY "Society owners can upload their documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'society-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Society owners can view their documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'society-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Society owners can update their documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'society-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Society owners can delete their documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'society-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Admins can access all society documents
CREATE POLICY "Admins can access all society documents" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'society-documents' AND EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE id = auth.uid() AND role = 'admin'
));