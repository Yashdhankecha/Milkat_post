# Database Rollback Instructions - September 21, 2025

This document provides step-by-step instructions to revert all database changes made on September 21, 2025, and restore your database to its previous state from September 20, 2025.

## Overview of Changes Made Today

Today's changes included:
1. Phone number normalization (adding 91 prefix to Indian phone numbers)
2. Updates to the `handle_new_user` function
3. Changes to member_invitations table and related functions
4. Storage policy updates
5. User roles and profile constraint modifications

## Rollback Steps

### Step 1: Revert Phone Number Normalization

Run these SQL commands to restore phone numbers to their original format:

```sql
-- Remove 91 prefix from phone numbers in profiles table
UPDATE public.profiles 
SET phone = SUBSTRING(phone FROM 3)
WHERE phone ~ '^91[0-9]{10}$';

-- Remove 91 prefix from phone numbers in user_roles table
UPDATE public.user_roles 
SET phone = SUBSTRING(phone FROM 3)
WHERE phone ~ '^91[0-9]{10}$';
```

### Step 2: Restore the handle_new_user Function

Replace the current `handle_new_user` function with the version from September 20:

```sql
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
```

### Step 3: Restore Profile Constraints

Restore the original profile role constraints:

```sql
-- Drop current constraint
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add back the original constraint
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'buyer_seller', 'broker', 'developer', 'society_owner', 'society_member'));
```

### Step 4: Remove Added Constraints

Remove the unique constraint that was added to user_roles:

```sql
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_role_unique;
```

### Step 5: Restore Member Invitations Table

Revert the member_invitations table to its previous state:

```sql
-- Revert column constraints
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

-- Restore original RLS policy
DROP POLICY IF EXISTS "Invited users can view their invitations by phone" ON public.member_invitations;

CREATE POLICY "Invited users can view their invitations" 
ON public.member_invitations 
FOR SELECT 
USING (
  email = (auth.jwt() ->> 'email'::text) OR 
  phone = (auth.jwt() ->> 'phone'::text)
);
```

### Step 6: Restore Storage Policies

Remove the new policies and restore the original ones:

```sql
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
```

## Alternative: Using Supabase CLI

If you have the Supabase CLI installed, you can run the rollback migrations directly:

1. Link your project:
   ```
   supabase link --project-ref xwpwkatpplinbtgoiayl
   ```

2. Reset the database to the state before today's changes:
   ```
   supabase db reset
   ```

3. Apply only the migrations up to September 20:
   ```
   supabase migration up 20250920000001
   ```

## Verification

After running the rollback, verify that:

1. Phone numbers in profiles and user_roles tables no longer have the 91 prefix
2. The handle_new_user function matches the version from September 20
3. Profile constraints are back to their original state
4. Member invitations table works as before
5. Storage policies are restored to their original state

## Important Notes

- Make sure to backup your database before running any of these commands
- Test these changes in a development environment first if possible
- Some of these changes may require admin privileges
- If you encounter any errors, check the specific error message and adjust accordingly