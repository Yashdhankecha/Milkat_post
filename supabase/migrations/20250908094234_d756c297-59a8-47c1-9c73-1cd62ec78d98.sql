-- Remove the overly permissive policy
DROP POLICY IF EXISTS "Allow public stats counting on profiles" ON public.profiles;

-- Create a secure function to get stats data
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS JSON AS $$
DECLARE
  client_count INTEGER;
  property_count INTEGER;
  broker_count INTEGER;
BEGIN
  -- Get counts using security definer privileges
  SELECT COUNT(*) INTO client_count FROM public.profiles;
  SELECT COUNT(*) INTO property_count FROM public.properties;
  SELECT COUNT(*) INTO broker_count FROM public.brokers WHERE status = 'active';
  
  -- Return as JSON
  RETURN json_build_object(
    'clients', client_count,
    'properties', property_count,
    'brokers', broker_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;