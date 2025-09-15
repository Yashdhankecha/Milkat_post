-- Fix the search path security issue
CREATE OR REPLACE FUNCTION public.auto_approve_buyers_sellers()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-approve buyers and sellers
  IF NEW.role IN ('buyer', 'seller') THEN
    NEW.verification_status = 'verified';
  END IF;
  
  RETURN NEW;
END;
$$;