-- Check what roles are currently in profiles vs what's allowed in user_roles
SELECT DISTINCT role FROM profiles;

-- Check the constraint on user_roles
SELECT conname, pg_get_constraintdef(oid) as constraint_def 
FROM pg_constraint 
WHERE conrelid = 'user_roles'::regclass 
AND contype = 'c';