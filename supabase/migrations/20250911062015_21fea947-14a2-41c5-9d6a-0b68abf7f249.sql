-- COMPLETELY disable RLS on societies table to eliminate recursion
ALTER TABLE public.societies DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "owners_full_access" ON public.societies;
DROP POLICY IF EXISTS "admin_read_access" ON public.societies;
DROP POLICY IF EXISTS "builder_read_requirements" ON public.societies;

-- For now, just create ONE simple policy for owners only
ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "society_owner_only"
ON public.societies
FOR ALL
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());