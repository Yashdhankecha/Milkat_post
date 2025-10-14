-- Drop the problematic policy that might cause circular reference
DROP POLICY IF EXISTS "Society members can view their society info" ON public.societies;

-- Create a new policy using a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_society_member_of(society_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM society_members 
    WHERE society_members.society_id = $1 AND society_members.user_id = auth.uid()
  );
$$;

-- Create the new policy using the function
CREATE POLICY "Society members can view their society info" 
ON public.societies 
FOR SELECT 
USING (public.is_society_member_of(id));