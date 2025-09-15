-- Fix the unique constraint issue - allow multiple invitations per flat but prevent active duplicates
ALTER TABLE member_invitations DROP CONSTRAINT IF EXISTS member_invitations_society_id_flat_number_key;

-- Add a composite unique constraint that only applies to pending invitations
CREATE UNIQUE INDEX IF NOT EXISTS member_invitations_unique_pending 
ON member_invitations(society_id, flat_number) 
WHERE status = 'pending';