-- Create "Other Projects" initiative for the current user
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users

INSERT INTO initiatives (name, user_id)
VALUES ('Other Projects', 'YOUR_USER_ID_HERE');

-- To get your user ID, run:
-- SELECT id, email FROM auth.users;
