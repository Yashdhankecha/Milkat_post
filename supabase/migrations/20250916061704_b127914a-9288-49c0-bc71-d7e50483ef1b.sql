-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Builders can view active requirements" ON redevelopment_requirements;

-- Create new policy that allows developers and builders to view active requirements
CREATE POLICY "Developers and builders can view active requirements" 
ON redevelopment_requirements 
FOR SELECT 
USING (
  status = 'active' AND (
    -- Allow developers to view active requirements
    EXISTS (
      SELECT 1 FROM developers 
      WHERE developers.user_id = auth.uid() AND developers.status = 'active'
    ) OR
    -- Allow admins to view all
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    ) OR
    -- Allow society members to view their society requirements
    society_id IN (
      SELECT society_members.society_id
      FROM society_members
      WHERE society_members.user_id = auth.uid()
    ) OR
    -- Allow society owners to view their society requirements  
    society_id IN (
      SELECT societies.id
      FROM societies
      WHERE societies.owner_id = auth.uid()
    )
  )
);