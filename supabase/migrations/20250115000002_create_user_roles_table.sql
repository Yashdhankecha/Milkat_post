-- Create user_roles table to support multiple roles per phone number
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

-- Enable RLS for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roles" 
ON public.user_roles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps for user_roles
CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_user_roles_updated_at();

-- Migrate existing profiles to user_roles table
INSERT INTO public.user_roles (user_id, phone, role, full_name, is_active)
SELECT 
  id, 
  phone, 
  role, 
  full_name, 
  CASE WHEN status = 'active' THEN true ELSE false END
FROM public.profiles
WHERE phone IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Add index for faster phone lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_phone ON public.user_roles(phone);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
