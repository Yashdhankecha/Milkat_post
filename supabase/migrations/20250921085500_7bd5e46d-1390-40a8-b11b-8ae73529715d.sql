-- First, let's add a unique constraint to user_roles table
ALTER TABLE user_roles ADD CONSTRAINT user_roles_user_role_unique UNIQUE (user_id, role);

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

-- Create a trigger to automatically sync user_roles when profiles change
CREATE OR REPLACE FUNCTION sync_user_roles()
RETURNS TRIGGER AS $$
BEGIN
    -- When a profile is created or updated, ensure user_roles entry exists
    INSERT INTO user_roles (user_id, role, full_name, phone, is_active)
    VALUES (
        NEW.id,
        NEW.role,
        NEW.full_name,
        COALESCE(NEW.phone, (
            SELECT u.phone 
            FROM auth.users u 
            WHERE u.id = NEW.id
        )),
        CASE WHEN NEW.status = 'active' THEN true ELSE false END
    )
    ON CONFLICT (user_id, role) 
    DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        is_active = EXCLUDED.is_active,
        updated_at = now();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically sync user_roles when profiles change
DROP TRIGGER IF EXISTS sync_user_roles_trigger ON profiles;
CREATE TRIGGER sync_user_roles_trigger
    AFTER INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_roles();