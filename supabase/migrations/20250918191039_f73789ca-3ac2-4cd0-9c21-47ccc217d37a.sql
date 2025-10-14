-- Fix RLS policy for requirements table to allow authenticated users to insert their own requirements
DROP POLICY IF EXISTS "Users can create requirements" ON public.requirements;

CREATE POLICY "Users can create requirements" 
ON public.requirements 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also ensure the user_id column is not nullable and has proper default
ALTER TABLE public.requirements 
ALTER COLUMN user_id SET NOT NULL;