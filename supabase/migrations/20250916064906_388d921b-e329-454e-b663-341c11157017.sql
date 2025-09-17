-- Fix infinite recursion in societies table policies
-- Drop the problematic policy that calls is_society_member_of function
DROP POLICY IF EXISTS "Society members can view their society info" ON societies;

-- Recreate a simpler policy for society members without circular dependency
CREATE POLICY "Society members can view their society info" 
ON societies 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM society_members 
    WHERE society_members.society_id = societies.id 
    AND society_members.user_id = auth.uid()
  )
);