-- Fix the trigger and sync existing data
-- Update existing user profile with correct phone number
UPDATE public.profiles 
SET phone = '918799038003' 
WHERE id = '26ecb51a-4681-43d8-bb16-1acf40bb8e72' AND phone IS NULL;

-- Create missing user_roles entry for the existing user
INSERT INTO public.user_roles (user_id, phone, role, full_name, is_active)
VALUES (
  '26ecb51a-4681-43d8-bb16-1acf40bb8e72',
  '918799038003', 
  'buyer_seller',
  'yash',
  true
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Fix the handle_new_user trigger to properly extract phone numbers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract phone number from different possible sources
  DECLARE
    phone_number TEXT;
    user_full_name TEXT;
    user_role TEXT;
  BEGIN
    -- Get phone number (could be in phone field or raw_user_meta_data)
    phone_number := COALESCE(
      NEW.phone,
      NEW.raw_user_meta_data->>'phone'
    );
    
    -- Get full name
    user_full_name := COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      phone_number,
      NEW.email
    );
    
    -- Get role
    user_role := COALESCE(
      NEW.raw_user_meta_data->>'role',
      'buyer_seller'
    );
    
    -- Create profile entry
    INSERT INTO public.profiles (id, full_name, role, phone)
    VALUES (
      NEW.id, 
      user_full_name,
      user_role,
      phone_number
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = COALESCE(profiles.full_name, user_full_name),
      phone = COALESCE(profiles.phone, phone_number),
      role = user_role;
    
    -- Create user_roles entry
    INSERT INTO public.user_roles (user_id, phone, role, full_name, is_active)
    VALUES (
      NEW.id,
      phone_number,
      user_role,
      user_full_name,
      true
    )
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN NEW;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;