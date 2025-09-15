-- Allow unauthenticated users to view pending invitations for registration
CREATE POLICY "Anyone can view pending invitations for registration" 
ON public.member_invitations 
FOR SELECT 
USING (status = 'pending' AND expires_at > now());