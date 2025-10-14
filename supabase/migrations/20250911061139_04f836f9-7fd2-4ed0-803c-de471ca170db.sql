-- Drop all existing policies on societies table
DROP POLICY IF EXISTS "Society owners can manage their societies" ON public.societies;
DROP POLICY IF EXISTS "Society members can view their society" ON public.societies;
DROP POLICY IF EXISTS "Admins can view all societies" ON public.societies;
DROP POLICY IF EXISTS "Builders can view active societies with requirements" ON public.societies;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.is_society_member(uuid);
DROP FUNCTION IF EXISTS public.is_society_owner(uuid);

-- Create security definer function to check society membership
CREATE OR REPLACE FUNCTION public.is_society_member(society_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM society_members 
    WHERE society_members.society_id = $1 AND society_members.user_id = auth.uid()
  );
$$;

-- Create security definer function to check if user is society owner
CREATE OR REPLACE FUNCTION public.is_society_owner(society_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM societies 
    WHERE societies.id = $1 AND societies.owner_id = auth.uid()
  );
$$;

-- Create simple, non-recursive policies
CREATE POLICY "Society owners can manage their societies"
ON public.societies
FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Society members can view their society"
ON public.societies
FOR SELECT
USING (public.is_society_member(id));

CREATE POLICY "Admins can view all societies"
ON public.societies
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Builders can view societies with requirements"
ON public.societies
FOR SELECT
USING (
  id IN (
    SELECT redevelopment_requirements.society_id
    FROM redevelopment_requirements
    WHERE redevelopment_requirements.status = 'active'
  )
);