-- Remove redundant policy that might be causing conflicts
DROP POLICY IF EXISTS "Society members can view their society requirements" ON redevelopment_requirements;

-- Ensure the comprehensive policy is working correctly by recreating it
DROP POLICY IF EXISTS "Developers and builders can view active requirements" ON redevelopment_requirements;

CREATE POLICY "Active requirements viewable by authorized users" 
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