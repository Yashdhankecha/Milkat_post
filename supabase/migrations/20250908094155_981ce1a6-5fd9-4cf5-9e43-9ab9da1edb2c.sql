-- Allow public access to count profiles for stats
CREATE POLICY "Allow public stats counting on profiles" 
ON public.profiles 
FOR SELECT 
USING (true);