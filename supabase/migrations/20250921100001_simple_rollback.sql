-- Simple rollback script to revert key changes made on September 21, 2025
-- This script will restore the database to work with the previous migration state

-- 1. Revert the handle_new_user function to the version from 20250920
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a basic profile for the user
  INSERT INTO public.profiles (id, full_name, role, phone)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.phone), 
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer_seller'),
    NEW.phone
  );
  
  -- Also create an entry in user_roles table
  INSERT INTO public.user_roles (user_id, phone, role, full_name, is_active)
  VALUES (
    NEW.id,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer_seller'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.phone),
    true
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Restore the original profiles constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'buyer_seller', 'broker', 'developer', 'society_owner', 'society_member'));

-- 3. Remove the unique constraint on user_roles if it exists
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_role_unique;

-- 4. Revert phone numbers to original format (remove 91 prefix)
UPDATE public.profiles 
SET phone = CASE 
  WHEN phone ~ '^91[0-9]{10}$' THEN SUBSTRING(phone FROM 3)
  ELSE phone
END
WHERE phone ~ '^91[0-9]{10}$';

UPDATE public.user_roles 
SET phone = CASE 
  WHEN phone ~ '^91[0-9]{10}$' THEN SUBSTRING(phone FROM 3)
  ELSE phone
END
WHERE phone ~ '^91[0-9]{10}$';

-- 5. Restore member_invitations table to original state
ALTER TABLE public.member_invitations 
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN phone DROP NOT NULL;

-- Restore the original auto_match_society_member function
CREATE OR REPLACE FUNCTION public.auto_match_society_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if a pending invitation exists for this user
  UPDATE member_invitations 
  SET status = 'accepted'
  WHERE (email = NEW.email OR phone = NEW.phone)
    AND status = 'pending'
    AND expires_at > now();

  -- If invitation was found and updated, create society membership
  IF FOUND THEN
    -- Get the invitation details
    WITH matched_invitation AS (
      SELECT society_id, flat_number 
      FROM member_invitations 
      WHERE (email = NEW.email OR phone = NEW.phone)
        AND status = 'accepted'
      LIMIT 1
    )
    INSERT INTO society_members (society_id, user_id, flat_number, status)
    SELECT society_id, NEW.id, flat_number, 'active'
    FROM matched_invitation;

    -- Update the profile to set society_member role
    UPDATE profiles 
    SET role = 'society_member'
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$function$;

-- Restore original RLS policy for member_invitations
DROP POLICY IF EXISTS "Invited users can view their invitations by phone" ON public.member_invitations;

CREATE POLICY "Invited users can view their invitations" 
ON public.member_invitations 
FOR SELECT 
USING (
  email = (auth.jwt() ->> 'email'::text) OR 
  phone = (auth.jwt() ->> 'phone'::text)
);

-- 6. Restore original storage policies
-- Drop new policies
DROP POLICY IF EXISTS "property_images_public_view" ON storage.objects;
DROP POLICY IF EXISTS "property_images_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "property_images_owner_manage" ON storage.objects;
DROP POLICY IF EXISTS "property_videos_public_view" ON storage.objects;
DROP POLICY IF EXISTS "property_videos_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "property_videos_owner_manage" ON storage.objects;
DROP POLICY IF EXISTS "society_documents_public_view" ON storage.objects;
DROP POLICY IF EXISTS "society_documents_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "society_documents_owner_manage" ON storage.objects;

-- Restore original policies
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