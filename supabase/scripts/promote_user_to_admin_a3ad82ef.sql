-- Promote the specified user to school_admin.
-- Safe to run in Supabase SQL editor (runs with service role; bypasses RLS).
-- Target user: a3ad82ef-3f2e-4eea-a7bf-f3810f6245ce

do $$
declare
  v_user uuid := 'a3ad82ef-3f2e-4eea-a7bf-f3810f6245ce';
  v_school uuid;
  v_exists boolean;
begin
  -- Ensure a school is present/assigned
  select school_id into v_school from public.users where id = v_user and deleted_at is null;

  if v_school is null then
    insert into public.schools (name)
    values ('ABOGIDA Default School')
    returning id into v_school;
  end if;

  -- Upsert the users row as school_admin
  select exists(select 1 from public.users where id = v_user) into v_exists;

  if v_exists then
    update public.users
      set role_key = 'school_admin',
          school_id = coalesce(school_id, v_school),
          deleted_at = null,
          updated_at = now()
    where id = v_user;
  else
    insert into public.users (id, role_key, school_id, language_preference)
    values (v_user, 'school_admin', v_school, 'en');
  end if;
end $$;
