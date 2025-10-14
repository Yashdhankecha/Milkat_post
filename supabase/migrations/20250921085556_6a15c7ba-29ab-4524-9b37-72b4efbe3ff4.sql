-- Update the role mapping - convert buyer to buyer_seller to match constraint
UPDATE profiles 
SET role = 'buyer_seller', updated_at = now()
WHERE role = 'buyer';

-- Now insert missing user_roles entries based on existing profiles
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