-- Comprehensive SQL Query for Supabase Database Verification and Fix
-- This query checks the database structure and fixes common issues

-- 1. Verify profiles table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Verify user_roles table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_roles' 
ORDER BY ordinal_position;

-- 3. Check if handle_new_user function exists
SELECT 
    proname, 
    provolatile, 
    prorettype 
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 4. Check if trigger exists
SELECT 
    tgname, 
    tgtype 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 5. Check for any duplicate entries in user_roles table
SELECT 
    user_id, 
    role, 
    COUNT(*) as duplicate_count
FROM user_roles 
GROUP BY user_id, role 
HAVING COUNT(*) > 1;

-- 6. Check for any duplicate entries in profiles table
SELECT 
    id, 
    COUNT(*) as duplicate_count
FROM profiles 
GROUP BY id 
HAVING COUNT(*) > 1;

-- 7. Sample data check - get a few profiles
SELECT 
    id, 
    full_name, 
    phone, 
    role,
    created_at,
    updated_at
FROM profiles 
LIMIT 5;

-- 8. Sample data check - get a few user roles
SELECT 
    id,
    user_id, 
    phone, 
    role, 
    full_name,
    is_active,
    created_at,
    updated_at
FROM user_roles 
LIMIT 5;

-- 9. Check phone number normalization function
SELECT 
    proname, 
    provolatile, 
    prorettype 
FROM pg_proc 
WHERE proname = 'normalize_phone';

-- 10. Verify RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('profiles', 'user_roles');

-- 11. Check indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('profiles', 'user_roles');

-- 12. Count total users, profiles, and roles
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM user_roles) as total_user_roles;

-- 13. Check for orphaned profiles (profiles without corresponding auth.users)
SELECT 
    p.id,
    p.full_name,
    p.phone
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL;

-- 14. Check for orphaned user_roles (roles without corresponding auth.users)
SELECT 
    ur.id,
    ur.user_id,
    ur.role,
    ur.full_name
FROM user_roles ur
LEFT JOIN auth.users u ON ur.user_id = u.id
WHERE u.id IS NULL;