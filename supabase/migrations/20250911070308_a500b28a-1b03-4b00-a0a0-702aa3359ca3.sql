-- Fix the unique constraint issue - allow multiple invitations per flat but prevent active duplicates
ALTER TABLE member_invitations DROP CONSTRAINT IF EXISTS member_invitations_society_id_flat_number_key;

-- Add a composite unique constraint that only applies to pending invitations
CREATE UNIQUE INDEX member_invitations_unique_pending 
ON member_invitations(society_id, flat_number) 
WHERE status = 'pending';

-- Add proper foreign key relationship between society_members and profiles
ALTER TABLE society_members 
ADD CONSTRAINT society_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;