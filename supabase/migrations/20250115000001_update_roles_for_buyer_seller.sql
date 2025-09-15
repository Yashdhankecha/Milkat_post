-- Update role constraint to combine buyer and seller into buyer_seller role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add updated check constraint with combined buyer_seller role
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'buyer_seller', 'broker', 'developer', 'society_owner', 'society_member'));

-- Update existing buyer and seller roles to buyer_seller
UPDATE public.profiles 
SET role = 'buyer_seller' 
WHERE role IN ('buyer', 'seller');
