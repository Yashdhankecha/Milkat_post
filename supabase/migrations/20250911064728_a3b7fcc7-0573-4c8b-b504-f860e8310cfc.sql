-- Add foreign key relationship between society_members and profiles
ALTER TABLE society_members 
ADD CONSTRAINT society_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Add missing columns to member_invitations for enhanced functionality
ALTER TABLE member_invitations ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE member_invitations ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE member_invitations ADD COLUMN IF NOT EXISTS qr_code text;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_member_invitations_qr_code ON member_invitations(qr_code);
CREATE INDEX IF NOT EXISTS idx_society_members_user_id ON society_members(user_id);