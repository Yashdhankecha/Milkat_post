-- Add phone number 8799038003 as admin user
-- This migration adds the specified phone number as an admin user in the system

-- First, check if a profile already exists for this phone number and update it
UPDATE public.profiles 
SET role = 'admin'
WHERE phone = '8799038003';

-- If no profile exists, insert a new one
INSERT INTO public.profiles (id, phone, role, full_name, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  '8799038003',
  'admin',
  'Admin User',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE phone = '8799038003'
);

-- Also update or insert into user_roles table for multi-role support
INSERT INTO public.user_roles (user_id, phone, role, full_name, is_active, created_at, updated_at)
SELECT 
  id,
  '8799038003',
  'admin',
  'Admin User',
  true,
  now(),
  now()
FROM public.profiles 
WHERE phone = '8799038003'
ON CONFLICT (user_id, role) 
DO UPDATE SET 
  role = 'admin',
  is_active = true,
  updated_at = now();