-- Fix the infinite recursion in user_roles policies
-- Drop the problematic admin policy
DROP POLICY IF EXISTS "Admins can manage all user roles" ON public.user_roles;

-- Create a security definer function to check admin role from profiles table
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Create new admin policy using the security definer function
CREATE POLICY "Admins can manage all user roles" ON public.user_roles
FOR ALL USING (public.is_admin_user());

-- Also create a policy to allow anonymous/public access for login role checking
CREATE POLICY "Allow role checking for login" ON public.user_roles
FOR SELECT USING (true);