-- Rollback script to revert all changes made on September 21, 2025
-- This script will restore the database to its state from September 20, 2025

-- 1. Revert phone number normalization changes
-- Restore phone numbers in profiles table to their original format
UPDATE public.profiles 
SET phone = CASE 
  WHEN phone ~ '^91[0-9]{10}$' THEN SUBSTRING(phone FROM 3)  -- Remove country code
  ELSE phone
END
WHERE phone IS NOT NULL AND phone ~ '^91[0-9]{10}$';

-- Restore phone numbers in user_roles table to their original format
UPDATE public.user_roles 
SET phone = CASE 
  WHEN phone ~ '^91[0-9]{10}$' THEN SUBSTRING(phone FROM 3)  -- Remove country code
  ELSE phone
END
WHERE phone IS NOT NULL AND phone ~ '^91[0-9]{10}$';

-- 2. Revert the improved handle_new_user function
-- Restore the previous version from 20250920
DROP FUNCTION IF EXISTS public.handle_new_user();

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

-- 3. Revert member_invitations table changes
-- Revert the column constraints
ALTER TABLE public.member_invitations 
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN phone DROP NOT NULL;

-- Revert the auto_match_society_member function to previous version
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

-- Revert RLS policy for member_invitations
DROP POLICY IF EXISTS "Invited users can view their invitations by phone" ON public.member_invitations;

CREATE POLICY "Invited users can view their invitations" 
ON public.member_invitations 
FOR SELECT 
USING (
  email = (auth.jwt() ->> 'email'::text) OR 
  phone = (auth.jwt() ->> 'phone'::text)
);

-- 4. Revert storage policies to previous state
-- Drop all new policies
DROP POLICY IF EXISTS "property_images_public_view" ON storage.objects;
DROP POLICY IF EXISTS "property_images_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "property_images_owner_manage" ON storage.objects;
DROP POLICY IF EXISTS "property_videos_public_view" ON storage.objects;
DROP POLICY IF EXISTS "property_videos_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "property_videos_owner_manage" ON storage.objects;
DROP POLICY IF EXISTS "society_documents_public_view" ON storage.objects;
DROP POLICY IF EXISTS "society_documents_authenticated_upload" ON storage.objects;
DROP POLICY IF EXISTS "society_documents_owner_manage" ON storage.objects;

-- Recreate original policies (based on previous migrations)
CREATE POLICY "Authenticated users can upload property images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Property images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'property-images');

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

-- 5. Revert user_roles changes
-- Drop the sync_user_roles function and trigger
DROP TRIGGER IF EXISTS sync_user_roles_trigger ON profiles;
DROP FUNCTION IF EXISTS sync_user_roles();

-- Remove the unique constraint on user_roles
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_user_role_unique;

-- Revert role values in profiles
UPDATE profiles 
SET role = CASE 
  WHEN role = 'buyer_seller' THEN 'buyer'
  ELSE role
END
WHERE role = 'buyer_seller';

-- Restore the original profiles constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'buyer', 'seller', 'broker', 'developer', 'society_owner', 'society_member'));

-- Make phone column NOT NULL again in user_roles (if it was changed)
-- Note: This might need to be adjusted based on your actual previous state
-- ALTER TABLE user_roles ALTER COLUMN phone SET NOT NULL;

-- 6. Revert the is_admin_user function
DROP FUNCTION IF EXISTS public.is_admin_user();

-- Recreate the original admin policy for user_roles
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow role checking for login" ON public.user_roles;

-- Note: The original policy would need to be recreated based on your previous setup
-- This is a placeholder - you should check your previous migration files for the exact policy
CREATE POLICY "Admins can manage all user roles" ON public.user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

COMMENT ON TABLE public.member_invitations IS 'Member invitations';