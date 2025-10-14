-- Create policy for developers to insert their own projects
CREATE POLICY "Developers can insert their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.developers 
    WHERE developers.id = projects.developer_id 
    AND developers.user_id = auth.uid()
  )
);

-- Create policy for developers to update their own projects
CREATE POLICY "Developers can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.developers 
    WHERE developers.id = projects.developer_id 
    AND developers.user_id = auth.uid()
  )
);

-- Create policy for developers to delete their own projects
CREATE POLICY "Developers can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.developers 
    WHERE developers.id = projects.developer_id 
    AND developers.user_id = auth.uid()
  )
);