-- Add new roles to the existing role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'society_owner';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'society_member'; 
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'builder_developer';

-- Create societies table
CREATE TABLE public.societies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  year_built INTEGER,
  total_flats INTEGER NOT NULL,
  registration_documents JSONB DEFAULT '[]'::jsonb,
  amenities TEXT[],
  condition_status TEXT DEFAULT 'good',
  society_code TEXT UNIQUE NOT NULL DEFAULT UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 8)),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create society_members table
CREATE TABLE public.society_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flat_number TEXT NOT NULL,
  ownership_proof TEXT,
  status TEXT DEFAULT 'active',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(society_id, flat_number),
  UNIQUE(society_id, user_id)
);

-- Create redevelopment_requirements table
CREATE TABLE public.redevelopment_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  requirement_type TEXT NOT NULL, -- redevelopment/repairs/expansion
  description TEXT,
  timeline_expectation TEXT,
  special_needs TEXT[],
  budget_range TEXT,
  status TEXT DEFAULT 'active',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.society_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redevelopment_requirements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for societies
CREATE POLICY "Society owners can manage their societies" 
ON public.societies 
FOR ALL 
USING (auth.uid() = owner_id);

CREATE POLICY "Society members can view their society" 
ON public.societies 
FOR SELECT 
USING (id IN (
  SELECT society_id FROM public.society_members 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Builders can view active societies with requirements" 
ON public.societies 
FOR SELECT 
USING (id IN (
  SELECT society_id FROM public.redevelopment_requirements 
  WHERE status = 'active'
));

-- Create RLS policies for society_members
CREATE POLICY "Society owners can manage members" 
ON public.society_members 
FOR ALL 
USING (society_id IN (
  SELECT id FROM public.societies 
  WHERE owner_id = auth.uid()
));

CREATE POLICY "Members can view their own membership" 
ON public.society_members 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Members can update their own details" 
ON public.society_members 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for redevelopment_requirements
CREATE POLICY "Society owners can manage requirements" 
ON public.redevelopment_requirements 
FOR ALL 
USING (society_id IN (
  SELECT id FROM public.societies 
  WHERE owner_id = auth.uid()
));

CREATE POLICY "Society members can view their society requirements" 
ON public.redevelopment_requirements 
FOR SELECT 
USING (society_id IN (
  SELECT society_id FROM public.society_members 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Builders can view active requirements" 
ON public.redevelopment_requirements 
FOR SELECT 
USING (status = 'active');

-- Create triggers for updated_at columns
CREATE TRIGGER update_societies_updated_at
BEFORE UPDATE ON public.societies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_redevelopment_requirements_updated_at
BEFORE UPDATE ON public.redevelopment_requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();