-- Fix infinite recursion in societies RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all societies" ON public.societies;
DROP POLICY IF EXISTS "Society members can view their society" ON public.societies;
DROP POLICY IF EXISTS "Society owners can manage their societies" ON public.societies;
DROP POLICY IF EXISTS "Builders can view active societies with requirements" ON public.societies;

-- Create a security definer function to check society membership
CREATE OR REPLACE FUNCTION public.is_society_member(society_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM society_members 
    WHERE society_members.society_id = $1 AND society_members.user_id = auth.uid()
  );
$$;

-- Create a security definer function to check if user is society owner
CREATE OR REPLACE FUNCTION public.is_society_owner(society_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM societies 
    WHERE societies.id = $1 AND societies.owner_id = auth.uid()
  );
$$;

-- Recreate societies policies without recursion
CREATE POLICY "Society owners can manage their societies"
ON public.societies
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Society members can view their society"
ON public.societies
FOR SELECT
USING (public.is_society_member(id));

CREATE POLICY "Admins can view all societies"
ON public.societies
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Builders can view societies with requirements"
ON public.societies
FOR SELECT
USING (
  id IN (
    SELECT redevelopment_requirements.society_id
    FROM redevelopment_requirements
    WHERE redevelopment_requirements.status = 'active'
  )
);

-- Ensure storage policies for society documents
CREATE POLICY "Society owners can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'society-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Society owners can view their documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'society-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Society members can view society documents"
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