-- Promote a user to super_admin (for founders)
-- Replace the UUID below with the target user's auth.users.id
-- Super admins have school_id = NULL (they see all schools)

-- Step 1: Update their role
UPDATE public.users
SET role_key = 'super_admin', school_id = NULL
WHERE id = 'REPLACE_WITH_USER_UUID';

-- Step 2: Verify
SELECT id, full_name, role_key, school_id FROM public.users
WHERE id = 'REPLACE_WITH_USER_UUID';
