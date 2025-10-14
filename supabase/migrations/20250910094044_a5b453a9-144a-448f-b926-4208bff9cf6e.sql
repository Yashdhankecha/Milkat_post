-- Update existing builder_developer profiles to developer role
UPDATE public.profiles 
SET role = 'developer' 
WHERE role = 'builder_developer';

-- Update any existing developers table records if they reference user profiles
UPDATE public.developers 
SET user_id = user_id 
WHERE user_id IN (
  SELECT id FROM public.profiles WHERE role = 'developer'
);