-- Check the constraint on profiles table
SELECT conname, pg_get_constraintdef(oid) as constraint_def 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND contype = 'c'
AND conname LIKE '%role%';