-- Simple SQL Query to Create an Admin User
-- Replace the placeholder values with actual data

-- First, ensure the UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create an admin user in the profiles table
INSERT INTO public.profiles (id, full_name, phone, role, status)
VALUES (
    uuid_generate_v4(), -- Generates a new UUID
    'Admin User',
    '919999999999', -- Replace with actual phone number
    'admin',
    'active'
);

-- Create the corresponding entry in user_roles table
INSERT INTO public.user_roles (user_id, phone, role, full_name, is_active)
SELECT id, phone, role, full_name, true
FROM public.profiles
WHERE role = 'admin'
ON CONFLICT (user_id, role) DO UPDATE SET
    is_active = true;

-- Alternative: Update an existing user to admin role
-- Uncomment the following lines and replace the UUID with actual user ID
/*
UPDATE public.profiles 
SET role = 'admin', status = 'active'
WHERE id = 'replace-with-actual-user-id';

UPDATE public.user_roles
SET role = 'admin', is_active = true
WHERE user_id = 'replace-with-actual-user-id';
*/