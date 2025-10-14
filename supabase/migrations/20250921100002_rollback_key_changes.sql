-- Key rollback operations for September 21, 2025 changes
-- This script reverts the most critical changes made today

-- 1. Revert phone numbers to original format (remove 91 prefix)
UPDATE public.profiles 
SET phone = SUBSTRING(phone FROM 3)
WHERE phone ~ '^91[0-9]{10}$';

UPDATE public.user_roles 
SET phone = SUBSTRING(phone FROM 3)
WHERE phone ~ '^91[0-9]{10}$';

-- 2. Restore the handle_new_user function to previous version
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

-- 3. Restore profile constraints
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'buyer_seller', 'broker', 'developer', 'society_owner', 'society_member'));

-- 4. Remove the unique constraint from user_roles
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_role_unique;

-- 5. Restore member_invitations to original state
ALTER TABLE public.member_invitations 
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN phone DROP NOT NULL;

-- Restore original auto_match_society_member function
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