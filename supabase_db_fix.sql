-- Supabase Database Fix Script
-- This script ensures the database is properly configured for the authentication system

-- 1. Ensure profiles table exists with correct structure
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'buyer_seller',
    bio TEXT,
    profile_picture TEXT,
    company_name TEXT,
    business_type TEXT,
    website TEXT,
    social_media JSONB,
    verification_status TEXT DEFAULT 'pending',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- 2. Ensure user_roles table exists with correct structure
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'buyer_seller', 'broker', 'developer', 'society_owner', 'society_member')),
    full_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, role)
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_roles_phone ON public.user_roles(phone);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 4. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 6. Create RLS policies for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own roles" ON public.user_roles;
CREATE POLICY "Users can insert their own roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own roles" ON public.user_roles;
CREATE POLICY "Users can update their own roles" 
ON public.user_roles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- 7. Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 8. Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Create phone normalization function
CREATE OR REPLACE FUNCTION public.normalize_phone(input_phone TEXT)
RETURNS TEXT AS $$
DECLARE
    cleaned TEXT;
BEGIN
    -- Remove all non-digit characters
    cleaned := regexp_replace(input_phone, '[^0-9]', '', 'g');
    
    -- Normalize to 91XXXXXXXXXX format for Indian numbers
    IF cleaned ~ '^91[0-9]{10}$' THEN
        RETURN cleaned;
    ELSIF cleaned ~ '^[0-9]{10}$' THEN
        RETURN '91' || cleaned;
    ELSIF cleaned ~ '^0[0-9]{10}$' THEN
        RETURN '91' || substring(cleaned from 2);
    ELSE
        RETURN cleaned;
    END IF;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 10. Create improved handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    phone_number TEXT;
    user_full_name TEXT;
    user_role TEXT;
    normalized_phone TEXT;
BEGIN
    -- Get phone number from different possible sources
    phone_number := COALESCE(
        NEW.phone,
        NEW.raw_user_meta_data->>'phone'
    );
    
    -- Normalize phone number
    IF phone_number IS NOT NULL THEN
        normalized_phone := public.normalize_phone(phone_number);
    END IF;
    
    -- Get full name
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        normalized_phone,
        NEW.email
    );
    
    -- Get role
    user_role := COALESCE(
        NEW.raw_user_meta_data->>'role',
        'buyer_seller'
    );
    
    -- Create or update profile entry
    INSERT INTO public.profiles (id, full_name, role, phone)
    VALUES (
        NEW.id, 
        user_full_name,
        user_role,
        normalized_phone
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(profiles.full_name, user_full_name),
        phone = COALESCE(profiles.phone, normalized_phone),
        role = user_role,
        updated_at = now();
    
    -- Create user_roles entry (only if we have a phone number)
    IF normalized_phone IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, phone, role, full_name, is_active)
        VALUES (
            NEW.id,
            normalized_phone,
            user_role,
            user_full_name,
            true
        )
        ON CONFLICT (user_id, role) DO UPDATE SET
            phone = normalized_phone,
            full_name = user_full_name,
            is_active = true,
            updated_at = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 12. Clean up any duplicate entries in user_roles table
DELETE FROM user_roles a
USING user_roles b
WHERE a.id < b.id
AND a.user_id = b.user_id
AND a.role = b.role;

-- 13. Clean up any duplicate entries in profiles table
DELETE FROM profiles a
USING profiles b
WHERE a.id < b.id
AND a.id = b.id;

-- 14. Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT EXECUTE ON FUNCTION public.normalize_phone TO authenticated;

-- 15. Create a test admin user (optional)
-- Uncomment the following lines to create an admin user
/*
INSERT INTO public.profiles (id, full_name, phone, role, status)
VALUES (
    '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
    'Admin User',
    '919999999999',
    'admin',
    'active'
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    status = 'active';

INSERT INTO public.user_roles (user_id, phone, role, full_name, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
    '919999999999',
    'admin',
    'Admin User',
    true
) ON CONFLICT (user_id, role) DO UPDATE SET
    role = 'admin',
    is_active = true;
*/

-- 16. Verify the setup
SELECT 'Database setup completed successfully' as status;