-- Update an existing user to admin role (using first user as example)
UPDATE profiles 
SET role = 'admin' 
WHERE id = '014a070d-a8c9-47c3-9cc0-2f3288963dec';

-- Or insert a new admin user if needed
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (gen_random_uuid(), 'admin@example.com', crypt('admin123', gen_salt('bf')), now(), now(), now());