-- Create flat_details table for member flat information
CREATE TABLE public.flat_details (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  society_member_id uuid NOT NULL REFERENCES public.society_members(id) ON DELETE CASCADE,
  flat_size numeric,
  floor_number integer,
  flat_condition text CHECK (flat_condition IN ('excellent', 'good', 'fair', 'poor', 'needs_renovation')),
  flat_type text, -- 1BHK, 2BHK, etc.
  carpet_area numeric,
  built_up_area numeric,
  ownership_type text CHECK (ownership_type IN ('owned', 'rented', 'inherited')),
  ownership_documents jsonb DEFAULT '[]'::jsonb,
  additional_details text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on flat_details
ALTER TABLE public.flat_details ENABLE ROW LEVEL SECURITY;

-- Create policies for flat_details
CREATE POLICY "Members can view their own flat details" 
ON public.flat_details 
FOR SELECT 
USING (
  society_member_id IN (
    SELECT id FROM society_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can insert their own flat details" 
ON public.flat_details 
FOR INSERT 
WITH CHECK (
  society_member_id IN (
    SELECT id FROM society_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Members can update their own flat details" 
ON public.flat_details 
FOR UPDATE 
USING (
  society_member_id IN (
    SELECT id FROM society_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Society owners can view all flat details in their society" 
ON public.flat_details 
FOR SELECT 
USING (
  society_member_id IN (
    SELECT sm.id 
    FROM society_members sm 
    JOIN societies s ON s.id = sm.society_id 
    WHERE s.owner_id = auth.uid()
  )
);

-- Create trigger for updating timestamps
CREATE TRIGGER update_flat_details_updated_at
  BEFORE UPDATE ON public.flat_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger to automatically create profile with society_member role when matching email/phone
CREATE OR REPLACE FUNCTION public.auto_match_society_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if a pending invitation exists for this user's email or phone
  UPDATE member_invitations 
  SET status = 'accepted'
  WHERE (email = NEW.email OR phone = COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone))
    AND status = 'pending'
    AND expires_at > now();

  -- If invitation was found and updated, create society membership
  IF FOUND THEN
    -- Get the invitation details
    WITH matched_invitation AS (
      SELECT society_id, flat_number 
      FROM member_invitations 
      WHERE (email = NEW.email OR phone = COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone))
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
$$;

-- Create trigger for auto matching
CREATE TRIGGER auto_match_society_member_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_match_society_member();