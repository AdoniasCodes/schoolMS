-- Migration 0016: Allow super_admin to insert users + get_user_email helper
-- Fix: The existing users_insert_admin policy only allowed school_admin,
-- so super_admin could not create school admin accounts when adding schools.

DROP POLICY IF EXISTS users_insert_admin ON public.users;

CREATE POLICY users_insert_admin ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (public.is_school_admin() OR public.is_super_admin());

-- Helper function to get a user's email from auth.users
-- Only super_admin can call this (SECURITY DEFINER runs as owner, bypassing RLS on auth.users)
CREATE OR REPLACE FUNCTION public.get_user_email(user_id uuid)
RETURNS TABLE(email text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT au.email::text
  FROM auth.users au
  WHERE au.id = user_id
    AND public.is_super_admin();
$$;

-- Helper function to reset a user's password (super_admin only)
CREATE OR REPLACE FUNCTION public.admin_reset_password(target_user_id uuid, new_password text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only super admins can reset passwords';
  END IF;
  IF length(new_password) < 6 THEN
    RAISE EXCEPTION 'Password must be at least 6 characters';
  END IF;
  -- Update the password in auth.users using Supabase's internal crypt
  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = target_user_id;
END;
$$;
