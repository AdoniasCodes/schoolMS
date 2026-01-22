-- ABOGIDA (FIDEL) - Fix RLS recursion and stabilize helper functions
-- Make helper functions SECURITY DEFINER and set search_path to avoid RLS recursion/500s.
-- Adjust users table policies to avoid self-referencing lookups.

-- 1) Recreate helper functions with SECURITY DEFINER
create or replace function public.current_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid();
$$;

create or replace function public.user_school_id(u_id uuid default auth.uid())
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select school_id from public.users where id = u_id and deleted_at is null;
$$;

create or replace function public.user_role(u_id uuid default auth.uid())
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role_key from public.users where id = u_id and deleted_at is null;
$$;

create or replace function public.is_school_admin(u_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select user_role(u_id) = 'school_admin';
$$;

create or replace function public.is_teacher(u_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select user_role(u_id) = 'teacher';
$$;

create or replace function public.is_parent(u_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select user_role(u_id) = 'parent';
$$;

create or replace function public.get_teacher_id(u_id uuid default auth.uid())
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select t.id from public.teachers t where t.user_id = u_id and t.deleted_at is null;
$$;

create or replace function public.get_parent_id(u_id uuid default auth.uid())
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id from public.parents p where p.user_id = u_id and p.deleted_at is null;
$$;

-- 2) Helper to check if a target user is in the same school as current user
create or replace function public.is_in_same_school(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select school_id from public.users where id = auth.uid() and deleted_at is null
  ), target as (
    select school_id from public.users where id = target_user_id and deleted_at is null
  )
  select exists (
    select 1 from me m, target t where m.school_id is not distinct from t.school_id
  );
$$;

-- 3) Recreate users policies to avoid recursive lookups
-- Drop existing users policies to replace them
drop policy if exists users_select_self_or_school on public.users;
drop policy if exists users_update_self_or_admin on public.users;
drop policy if exists users_insert_admin on public.users;

-- Only self can select own user; admins can select users in the same school via helper
create policy users_select_self_or_admin_school on public.users for select
  to authenticated
  using (
    id = auth.uid() or (public.is_school_admin() and public.is_in_same_school(users.id))
  );

-- Updates: self can update own row; admins can update users in same school
create policy users_update_self_or_admin_school on public.users for update
  to authenticated
  using (
    id = auth.uid() or (public.is_school_admin() and public.is_in_same_school(users.id))
  )
  with check (
    id = auth.uid() or (public.is_school_admin() and public.is_in_same_school(users.id))
  );

-- Inserts: only admins
create policy users_insert_admin on public.users for insert
  to authenticated
  with check (public.is_school_admin());

-- Note: other table policies continue to use helper functions which now run as SECURITY DEFINER and avoid RLS recursion.
