-- Auto-approve buyer and seller accounts by default
-- Update existing buyer and seller profiles to be verified
UPDATE profiles 
SET verification_status = 'verified'
WHERE role IN ('buyer', 'seller') AND verification_status = 'pending';

-- Create trigger to auto-approve buyer and seller accounts on creation
CREATE OR REPLACE FUNCTION public.auto_approve_buyers_sellers()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-approve buyers and sellers
  IF NEW.role IN ('buyer', 'seller') THEN
    NEW.verification_status = 'verified';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new profile insertions
DROP TRIGGER IF EXISTS auto_approve_buyers_sellers_trigger ON profiles;
CREATE TRIGGER auto_approve_buyers_sellers_trigger
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_approve_buyers_sellers();

-- Add pending status for properties that need approval
UPDATE properties 
SET status = 'pending' 
WHERE status = 'available' 
AND owner_id IN (
  SELECT id FROM profiles WHERE role = 'seller' AND verification_status = 'pending'
);

-- Add pending status for projects that need approval  
UPDATE projects 
SET status = 'pending'
WHERE status = 'ongoing';