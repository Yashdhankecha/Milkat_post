-- Add policy to allow developers to view society information for redevelopment requirements
CREATE POLICY "Developers can view societies with active redevelopment requirements" 
ON societies 
FOR SELECT 
USING (
  id IN (
    SELECT society_id 
    FROM redevelopment_requirements 
    WHERE status = 'active'
  ) AND 
  EXISTS (
    SELECT 1 FROM developers 
    WHERE developers.user_id = auth.uid() AND developers.status = 'active'
  )
);