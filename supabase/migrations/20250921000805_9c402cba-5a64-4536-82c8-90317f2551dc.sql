-- Update member_invitations table to make email optional and phone required
ALTER TABLE public.member_invitations 
ALTER COLUMN email DROP NOT NULL,
ALTER COLUMN phone SET NOT NULL;

-- Update the auto_match_society_member function to primarily use phone matching
CREATE OR REPLACE FUNCTION public.auto_match_society_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if a pending invitation exists for this user's phone (primary) or email (fallback)
  UPDATE member_invitations 
  SET status = 'accepted'
  WHERE (phone = COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone) OR 
         (email IS NOT NULL AND email = NEW.email))
    AND status = 'pending'
    AND expires_at > now();

  -- If invitation was found and updated, create society membership
  IF FOUND THEN
    -- Get the invitation details
    WITH matched_invitation AS (
      SELECT society_id, flat_number 
      FROM member_invitations 
      WHERE (phone = COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone) OR 
             (email IS NOT NULL AND email = NEW.email))
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

-- Update RLS policy for member_invitations to work with phone-based authentication
DROP POLICY IF EXISTS "Invited users can view their invitations" ON public.member_invitations;

CREATE POLICY "Invited users can view their invitations by phone" 
ON public.member_invitations 
FOR SELECT 
USING (
  phone = (auth.jwt() ->> 'phone'::text) OR 
  (email IS NOT NULL AND email = (auth.jwt() ->> 'email'::text))
);

-- Add comment explaining the migration
COMMENT ON TABLE public.member_invitations IS 'Member invitations - migrated to phone-first authentication with email as fallback';