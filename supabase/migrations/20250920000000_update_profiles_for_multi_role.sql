-- Update profiles table to support multi-role system
-- This migration ensures the profiles table works correctly with the new user_roles table

-- Drop the old role constraint and add the new one with updated roles
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'buyer_seller', 'broker', 'developer', 'society_owner', 'society_member'));

-- Add a comment to indicate this table now works with user_roles
COMMENT ON TABLE public.profiles IS 'User profiles table - works in conjunction with user_roles table for multi-role support';

-- Update the handle_new_user function to work with the new system
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a basic profile for the user
  INSERT INTO public.profiles (id, full_name, role, phone)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.phone), 
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer_seller'),
    NEW.phone
  );
  
  -- Also create an entry in user_roles table
  INSERT INTO public.user_roles (user_id, phone, role, full_name, is_active)
  VALUES (
    NEW.id,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer_seller'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.phone),
    true
  )
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();