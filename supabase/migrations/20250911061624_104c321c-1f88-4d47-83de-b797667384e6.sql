-- Disable RLS temporarily
ALTER TABLE public.societies DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Society owners can manage their societies" ON public.societies;
DROP POLICY IF EXISTS "Society members can view their society" ON public.societies;
DROP POLICY IF EXISTS "Admins can view all societies" ON public.societies;
DROP POLICY IF EXISTS "Builders can view societies with requirements" ON public.societies;

-- Re-enable RLS
ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;

-- Create the most basic, non-recursive policy first (owner access)
CREATE POLICY "owners_full_access"
ON public.societies
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Create a simple admin access policy
CREATE POLICY "admin_read_access"
ON public.societies
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Create builder access policy (external table, should be safe)
CREATE POLICY "builder_read_requirements"
ON public.societies
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT society_id FROM public.redevelopment_requirements 
    WHERE status = 'active'
  )
);