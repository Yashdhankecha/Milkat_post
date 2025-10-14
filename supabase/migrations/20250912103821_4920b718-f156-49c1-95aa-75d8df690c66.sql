-- Add missing columns to societies table for comprehensive society profile
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS society_type text;
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS number_of_blocks integer;
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS total_area numeric;
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS registration_date date;
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS fsi numeric;
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS road_facing text;
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS contact_person_name text;
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS flat_variants jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.societies ADD COLUMN IF NOT EXISTS flat_plan_documents jsonb DEFAULT '[]'::jsonb;