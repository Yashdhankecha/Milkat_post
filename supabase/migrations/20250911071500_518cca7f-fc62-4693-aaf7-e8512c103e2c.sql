-- Add foreign key constraint between society_members and profiles
ALTER TABLE public.society_members 
ADD CONSTRAINT society_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;