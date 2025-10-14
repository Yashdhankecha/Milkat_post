-- Drop all existing policies on societies table to start fresh
DROP POLICY IF EXISTS "Developers can view societies with active redevelopment require" ON societies;
DROP POLICY IF EXISTS "Society members can view their society info" ON societies;
DROP POLICY IF EXISTS "society_owner_only" ON societies;

-- Create simple, non-recursive policies
-- 1. Society owners can manage their own societies
CREATE POLICY "Society owners can manage their societies" 
ON societies 
FOR ALL 
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- 2. Society members can view their society (direct join, no function calls)
CREATE POLICY "Society members can view their society" 
ON societies 
FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT society_id 
    FROM society_members 
    WHERE user_id = auth.uid()
  )
);

-- 3. Developers can view societies with active redevelopment requirements
CREATE POLICY "Developers can view societies for redevelopment" 
ON societies 
FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT society_id 
    FROM redevelopment_requirements 
    WHERE status = 'active'
  ) 
  AND 
  auth.uid() IN (
    SELECT user_id 
    FROM developers 
    WHERE status = 'active'
  )
);