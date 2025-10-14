-- Fix the role check constraint to include all roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add updated check constraint with all roles
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'buyer', 'seller', 'broker', 'developer', 'society_owner', 'society_member'));

-- Create proposals table for builder proposals
CREATE TABLE public.proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requirement_id UUID NOT NULL REFERENCES public.redevelopment_requirements(id) ON DELETE CASCADE,
  developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  timeline TEXT NOT NULL,
  budget_estimate NUMERIC NOT NULL,
  technical_details JSONB DEFAULT '{}',
  terms_conditions TEXT,
  attachments TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'accepted', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create votes table for member voting
CREATE TABLE public.votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  society_member_id UUID NOT NULL REFERENCES public.society_members(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('approve', 'reject', 'abstain')),
  comments TEXT,
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(proposal_id, society_member_id)
);

-- Enable RLS on new tables
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for proposals
CREATE POLICY "Proposals are viewable by society members and developers" 
ON public.proposals FOR SELECT 
USING (
  requirement_id IN (
    SELECT redevelopment_requirements.id 
    FROM redevelopment_requirements 
    JOIN society_members ON society_members.society_id = redevelopment_requirements.society_id 
    WHERE society_members.user_id = auth.uid()
  ) 
  OR developer_id IN (
    SELECT developers.id 
    FROM developers 
    WHERE developers.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Developers can create proposals" 
ON public.proposals FOR INSERT 
WITH CHECK (
  developer_id IN (
    SELECT developers.id 
    FROM developers 
    WHERE developers.user_id = auth.uid()
  )
);

CREATE POLICY "Developers can update their own proposals" 
ON public.proposals FOR UPDATE 
USING (
  developer_id IN (
    SELECT developers.id 
    FROM developers 
    WHERE developers.user_id = auth.uid()
  )
);

CREATE POLICY "Society owners can review proposals" 
ON public.proposals FOR UPDATE 
USING (
  requirement_id IN (
    SELECT redevelopment_requirements.id 
    FROM redevelopment_requirements 
    JOIN societies ON societies.id = redevelopment_requirements.society_id 
    WHERE societies.owner_id = auth.uid()
  )
);

-- RLS policies for votes
CREATE POLICY "Votes are viewable by society members" 
ON public.votes FOR SELECT 
USING (
  proposal_id IN (
    SELECT proposals.id 
    FROM proposals 
    JOIN redevelopment_requirements ON redevelopment_requirements.id = proposals.requirement_id 
    JOIN society_members ON society_members.society_id = redevelopment_requirements.society_id 
    WHERE society_members.user_id = auth.uid()
  )
);

CREATE POLICY "Society members can vote" 
ON public.votes FOR INSERT 
WITH CHECK (
  society_member_id IN (
    SELECT society_members.id 
    FROM society_members 
    WHERE society_members.user_id = auth.uid()
  )
);

CREATE POLICY "Members can update their own votes" 
ON public.votes FOR UPDATE 
USING (
  society_member_id IN (
    SELECT society_members.id 
    FROM society_members 
    WHERE society_members.user_id = auth.uid()
  )
);

-- Add updated_at triggers
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create member invitations table
CREATE TABLE public.member_invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  flat_number TEXT NOT NULL,
  invited_by UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(society_id, email),
  UNIQUE(society_id, flat_number)
);

ALTER TABLE public.member_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for member invitations
CREATE POLICY "Society owners can manage invitations" 
ON public.member_invitations FOR ALL 
USING (
  society_id IN (
    SELECT societies.id 
    FROM societies 
    WHERE societies.owner_id = auth.uid()
  )
);

CREATE POLICY "Invited users can view their invitations" 
ON public.member_invitations FOR SELECT 
USING (email = auth.jwt()->>'email');

CREATE TRIGGER update_member_invitations_updated_at
  BEFORE UPDATE ON public.member_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();