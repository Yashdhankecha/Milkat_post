-- Fix phone number storage and create better trigger
-- First, normalize existing phone numbers in both tables
UPDATE public.profiles 
SET phone = CASE 
  WHEN phone ~ '^91[0-9]{10}$' THEN phone  -- Already normalized
  WHEN phone ~ '^[0-9]{10}$' THEN '91' || phone  -- Add country code
  WHEN phone ~ '^\+91[0-9]{10}$' THEN SUBSTRING(phone FROM 2)  -- Remove +
  WHEN phone ~ '^0[0-9]{10}$' THEN '91' || SUBSTRING(phone FROM 2)  -- Remove 0, add country code
  ELSE phone
END
WHERE phone IS NOT NULL;

UPDATE public.user_roles 
SET phone = CASE 
  WHEN phone ~ '^91[0-9]{10}$' THEN phone  -- Already normalized
  WHEN phone ~ '^[0-9]{10}$' THEN '91' || phone  -- Add country code
  WHEN phone ~ '^\+91[0-9]{10}$' THEN SUBSTRING(phone FROM 2)  -- Remove +
  WHEN phone ~ '^0[0-9]{10}$' THEN '91' || SUBSTRING(phone FROM 2)  -- Remove 0, add country code
  ELSE phone
END
WHERE phone IS NOT NULL;

-- Create improved handle_new_user function
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
    
    -- Normalize phone number (remove +, ensure 91 country code for 10 digit numbers)
    IF phone_number IS NOT NULL THEN
        -- Remove non-digits
        normalized_phone := regexp_replace(phone_number, '[^0-9]', '', 'g');
        
        -- Normalize to 91XXXXXXXXXX format
        IF normalized_phone ~ '^91[0-9]{10}$' THEN
            normalized_phone := normalized_phone;  -- Already correct
        ELSIF normalized_phone ~ '^[0-9]{10}$' THEN
            normalized_phone := '91' || normalized_phone;  -- Add country code
        ELSIF normalized_phone ~ '^0[0-9]{10}$' THEN
            normalized_phone := '91' || substring(normalized_phone from 2);  -- Remove 0, add country code
        END IF;
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