-- Stabilize RLS for teachers, classes, daily_updates by moving logic into SECURITY DEFINER helpers
-- and simplifying SELECT policies to avoid cross-table RLS recursion.

-- =========================
-- SAFE HELPER FUNCTIONS
-- =========================

create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid()
$$;

create or replace function public.current_school_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select school_id
  from public.users
  where id = auth.uid()
$$;

create or replace function public.current_teacher_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select id
  from public.teachers
  where user_id = auth.uid()
$$;

-- =========================
-- TEACHERS RLS
-- =========================

alter table public.teachers enable row level security;

-- Drop previous SELECT policies if present (from earlier migrations)
drop policy if exists teachers_select on public.teachers;
drop policy if exists teachers_select_scope on public.teachers;

create policy teachers_select
on public.teachers
for select
to authenticated
using (
  user_id = auth.uid()
);

-- =========================
-- CLASSES RLS
-- =========================

alter table public.classes enable row level security;

-- Drop previous SELECT policies if present (from earlier migrations)
drop policy if exists classes_select on public.classes;
drop policy if exists classes_select_scope on public.classes;

create policy classes_select
on public.classes
for select
to authenticated
using (
  school_id = public.current_school_id()
);

-- =========================
-- DAILY UPDATES RLS
-- =========================

alter table public.daily_updates enable row level security;

-- Drop previous SELECT policies if present (from earlier migrations)
drop policy if exists daily_updates_select on public.daily_updates;
drop policy if exists daily_updates_select_scope on public.daily_updates;

create policy daily_updates_select
on public.daily_updates
for select
to authenticated
using (
  teacher_id = public.current_teacher_id()
);
