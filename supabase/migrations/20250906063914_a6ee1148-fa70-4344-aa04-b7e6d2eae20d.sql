-- Add 'suspended' as a valid status for profiles
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_status_check 
CHECK (status IN ('active', 'inactive', 'suspended'));

-- Add 'suspended' as a valid status for properties  
ALTER TABLE public.properties
ADD CONSTRAINT properties_status_check
CHECK (status IN ('available', 'pending', 'sold', 'rented', 'suspended'));