-- Fix the remaining recursive policy
DROP POLICY IF EXISTS "Society members can view their society" ON public.societies;

-- Recreate the policy using the security definer function
CREATE POLICY "Society members can view their society"
ON public.societies
FOR SELECT
USING (public.is_society_member(id));