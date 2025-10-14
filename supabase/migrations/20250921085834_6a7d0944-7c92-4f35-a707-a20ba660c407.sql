-- Fix role constraint mismatch between tables
-- First, update the profiles constraint to match user_roles
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the updated constraint to profiles table to match user_roles
ALTER TABLE profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role = ANY (ARRAY['admin'::text, 'buyer_seller'::text, 'broker'::text, 'developer'::text, 'society_owner'::text, 'society_member'::text]));

-- Update existing 'buyer' and 'seller' roles to 'buyer_seller' in profiles
UPDATE profiles 
SET role = 'buyer_seller' 
WHERE role IN ('buyer', 'seller');

-- Now add the unique constraint to user_roles table  
ALTER TABLE user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_role_unique;

ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role);

-- Insert missing user_roles entries based on existing profiles
INSERT INTO user_roles (user_id, role, full_name, phone, is_active)
SELECT 
    id as user_id,
    role,
    full_name,
    COALESCE(phone, (
        SELECT u.phone 
        FROM auth.users u 
        WHERE u.id = profiles.id
    )) as phone,
    true as is_active
FROM profiles 
WHERE id NOT IN (
    SELECT user_id 
    FROM user_roles 
    WHERE user_id = profiles.id
)
AND role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;