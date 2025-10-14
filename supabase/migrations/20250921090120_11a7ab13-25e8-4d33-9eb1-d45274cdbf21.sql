-- Check what roles exist in profiles currently
SELECT role, COUNT(*) as count FROM profiles GROUP BY role;

-- First, remove the constraint temporarily
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Update existing data to use consistent role values
UPDATE profiles 
SET role = 'buyer_seller' 
WHERE role IN ('buyer', 'seller');

-- Now add the constraint back with the correct values
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'buyer_seller'::text, 'broker'::text, 'developer'::text, 'society_owner'::text, 'society_member'::text]));