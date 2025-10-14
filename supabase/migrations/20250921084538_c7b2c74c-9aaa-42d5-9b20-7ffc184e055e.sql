-- Check current policies on user_roles table
SELECT schemaname, tablename, policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'user_roles' AND schemaname = 'public';