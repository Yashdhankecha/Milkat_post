-- Update profiles table to include role information to simplify the codebase
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'buyer_seller' CHECK (role IN ('admin', 'buyer_seller', 'broker', 'developer', 'society_owner', 'society_member'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);