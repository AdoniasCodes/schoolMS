-- ABOGIDA (FIDEL) - RLS helper functions and policies
-- Enable strict Row Level Security across all tables and define policies

-- Helper functions
create or replace function public.current_user_id()
returns uuid language sql stable as $$
  select auth.uid();
$$;

create or replace function public.user_school_id(u_id uuid default auth.uid())
returns uuid language sql stable as $$
  select school_id from public.users where id = u_id and deleted_at is null;
$$;

create or replace function public.user_role(u_id uuid default auth.uid())
returns text language sql stable as $$
  select role_key from public.users where id = u_id and deleted_at is null;
$$;

create or replace function public.is_school_admin(u_id uuid default auth.uid())
returns boolean language sql stable as $$
  select user_role(u_id) = 'school_admin';
$$;

create or replace function public.is_teacher(u_id uuid default auth.uid())
returns boolean language sql stable as $$
  select user_role(u_id) = 'teacher';
$$;

create or replace function public.is_parent(u_id uuid default auth.uid())
returns boolean language sql stable as $$
  select user_role(u_id) = 'parent';
$$;

create or replace function public.get_teacher_id(u_id uuid default auth.uid())
returns uuid language sql stable as $$
  select t.id from public.teachers t where t.user_id = u_id and t.deleted_at is null;
$$;

create or replace function public.get_parent_id(u_id uuid default auth.uid())
returns uuid language sql stable as $$
  select p.id from public.parents p where p.user_id = u_id and p.deleted_at is null;
$$;

-- Enable RLS on all relevant tables
alter table public.roles enable row level security;
alter table public.schools enable row level security;
alter table public.users enable row level security;
alter table public.teachers enable row level security;
alter table public.parents enable row level security;
alter table public.students enable row level security;
alter table public.parent_students enable row level security;
alter table public.classes enable row level security;
alter table public.enrollments enable row level security;
alter table public.attendance enable row level security;
alter table public.daily_updates enable row level security;
alter table public.messages enable row level security;
alter table public.progress_reports enable row level security;
alter table public.announcements enable row level security;
alter table public.media_assets enable row level security;

-- Default deny: no permissive policies until defined

-- roles: readable by authenticated (non-sensitive), no writes client-side
create policy roles_read on public.roles for select
  to authenticated
  using (true);

-- schools
create policy schools_select on public.schools for select
  to authenticated
  using (id = user_school_id());

create policy schools_insert_admin on public.schools for insert
  to authenticated
  with check (is_school_admin());

create policy schools_update_admin on public.schools for update
  to authenticated
  using (is_school_admin() and id = user_school_id())
  with check (is_school_admin() and id = user_school_id());

-- users
create policy users_select_self_or_school on public.users for select
  to authenticated
  using (
    id = auth.uid() -- self
    or (school_id = user_school_id()) -- same school
  );

create policy users_update_self_or_admin on public.users for update
  to authenticated
  using (
    id = auth.uid() or (is_school_admin() and school_id = user_school_id())
  )
  with check (
    id = auth.uid() or (is_school_admin() and school_id = user_school_id())
  );

create policy users_insert_admin on public.users for insert
  to authenticated
  with check (is_school_admin());

-- teachers
create policy teachers_select_scope on public.teachers for select
  to authenticated
  using (
    user_id = auth.uid() -- self
    or school_id = user_school_id() -- same school
  );

create policy teachers_cud_admin on public.teachers for all
  to authenticated
  using (is_school_admin() and school_id = user_school_id())
  with check (is_school_admin() and school_id = user_school_id());

-- parents
create policy parents_select_scope on public.parents for select
  to authenticated
  using (
    user_id = auth.uid() or school_id = user_school_id()
  );

create policy parents_cud_admin on public.parents for all
  to authenticated
  using (is_school_admin() and school_id = user_school_id())
  with check (is_school_admin() and school_id = user_school_id());

-- students
create policy students_select_scope on public.students for select
  to authenticated
  using (
    school_id = user_school_id()
    and (
      is_school_admin()
      or exists (
        select 1 from public.enrollments e
        join public.classes c on c.id = e.class_id
        where e.student_id = students.id and c.teacher_id = get_teacher_id()
      )
      or exists (
        select 1 from public.parent_students ps
        where ps.student_id = students.id and ps.parent_id = get_parent_id()
      )
    )
  );

create policy students_insert_admin on public.students for insert
  to authenticated
  with check (is_school_admin() and school_id = user_school_id());

create policy students_update_admin on public.students for update
  to authenticated
  using (is_school_admin() and school_id = user_school_id())
  with check (is_school_admin() and school_id = user_school_id());

-- parent_students
create policy parent_students_select_scope on public.parent_students for select
  to authenticated
  using (
    exists (
      select 1 from public.parents p where p.id = parent_students.parent_id and (
        p.user_id = auth.uid() or p.school_id = user_school_id()
      )
    )
  );

create policy parent_students_cud_admin on public.parent_students for all
  to authenticated
  using (is_school_admin())
  with check (is_school_admin());

-- classes
create policy classes_select_scope on public.classes for select
  to authenticated
  using (
    school_id = user_school_id() and (
      is_school_admin()
      or teacher_id = get_teacher_id()
      or exists (
        select 1 from public.enrollments e
        where e.class_id = classes.id and exists (
          select 1 from public.parent_students ps
          where ps.student_id = e.student_id and ps.parent_id = get_parent_id()
        )
      )
    )
  );

create policy classes_cud_admin on public.classes for all
  to authenticated
  using (is_school_admin() and school_id = user_school_id())
  with check (is_school_admin() and school_id = user_school_id());

-- enrollments
create policy enrollments_select_scope on public.enrollments for select
  to authenticated
  using (
    school_id = user_school_id() and (
      is_school_admin()
      or exists (select 1 from public.classes c where c.id = enrollments.class_id and c.teacher_id = get_teacher_id())
      or exists (
        select 1 from public.parent_students ps
        where ps.student_id = enrollments.student_id and ps.parent_id = get_parent_id()
      )
    )
  );

create policy enrollments_cud_admin on public.enrollments for all
  to authenticated
  using (is_school_admin() and school_id = user_school_id())
  with check (is_school_admin() and school_id = user_school_id());

-- attendance
create policy attendance_select_scope on public.attendance for select
  to authenticated
  using (
    school_id = user_school_id() and (
      is_school_admin()
      or exists (select 1 from public.classes c where c.id = attendance.class_id and c.teacher_id = get_teacher_id())
      or exists (
        select 1 from public.parent_students ps where ps.student_id = attendance.student_id and ps.parent_id = get_parent_id()
      )
    )
  );

create policy attendance_insert_teacher_or_admin on public.attendance for insert
  to authenticated
  with check (
    school_id = user_school_id() and (
      is_school_admin()
      or exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = get_teacher_id())
    )
  );

create policy attendance_update_teacher_or_admin on public.attendance for update
  to authenticated
  using (
    school_id = user_school_id() and (
      is_school_admin()
      or exists (select 1 from public.classes c where c.id = attendance.class_id and c.teacher_id = get_teacher_id())
    )
  )
  with check (
    school_id = user_school_id() and (
      is_school_admin()
      or exists (select 1 from public.classes c where c.id = attendance.class_id and c.teacher_id = get_teacher_id())
    )
  );

-- daily_updates
create policy daily_updates_select_scope on public.daily_updates for select
  to authenticated
  using (
    school_id = user_school_id() and (
      is_school_admin()
      or teacher_id = get_teacher_id()
      or exists (
        select 1 from public.enrollments e
        where e.class_id = daily_updates.class_id and exists (
          select 1 from public.parent_students ps
          where ps.student_id = e.student_id and ps.parent_id = get_parent_id()
        )
      )
    )
  );

create policy daily_updates_insert_teacher_or_admin on public.daily_updates for insert
  to authenticated
  with check (
    school_id = user_school_id() and (
      is_school_admin() or teacher_id = get_teacher_id()
    )
  );

create policy daily_updates_update_author_or_admin on public.daily_updates for update
  to authenticated
  using (
    school_id = user_school_id() and (
      is_school_admin() or teacher_id = get_teacher_id()
    )
  )
  with check (
    school_id = user_school_id() and (
      is_school_admin() or teacher_id = get_teacher_id()
    )
  );

-- messages (1:1 parent-teacher)
create policy messages_select_participants on public.messages for select
  to authenticated
  using (
    school_id = user_school_id() and (
      parent_id = get_parent_id() or teacher_id = get_teacher_id() or is_school_admin()
    )
  );

create policy messages_insert_participants on public.messages for insert
  to authenticated
  with check (
    school_id = user_school_id() and (
      parent_id = get_parent_id() or teacher_id = get_teacher_id() or is_school_admin()
    )
  );

-- progress_reports
create policy progress_reports_select_scope on public.progress_reports for select
  to authenticated
  using (
    school_id = user_school_id() and (
      is_school_admin()
      or teacher_id = get_teacher_id()
      or exists (
        select 1 from public.parent_students ps where ps.student_id = progress_reports.student_id and ps.parent_id = get_parent_id()
      )
    )
  );

create policy progress_reports_insert_teacher_or_admin on public.progress_reports for insert
  to authenticated
  with check (
    school_id = user_school_id() and (
      is_school_admin() or teacher_id = get_teacher_id()
    )
  );

create policy progress_reports_update_author_or_admin on public.progress_reports for update
  to authenticated
  using (
    school_id = user_school_id() and (
      is_school_admin() or teacher_id = get_teacher_id()
    )
  )
  with check (
    school_id = user_school_id() and (
      is_school_admin() or teacher_id = get_teacher_id()
    )
  );

-- announcements
create policy announcements_select_scope on public.announcements for select
  to authenticated
  using (
    school_id = user_school_id() and (
      is_school_admin()
      or (class_id is null) -- school-wide
      or exists (
        select 1 from public.classes c where c.id = announcements.class_id and (
          c.teacher_id = get_teacher_id()
          or exists (
            select 1 from public.enrollments e
            where e.class_id = c.id and exists (
              select 1 from public.parent_students ps
              where ps.student_id = e.student_id and ps.parent_id = get_parent_id()
            )
          )
        )
      )
    )
  );

create policy announcements_insert_teacher_or_admin on public.announcements for insert
  to authenticated
  with check (
    school_id = user_school_id() and (is_school_admin() or exists (select 1 from public.teachers t where t.id = created_by and t.user_id = auth.uid()))
  );

create policy announcements_update_author_or_admin on public.announcements for update
  to authenticated
  using (
    school_id = user_school_id() and (
      is_school_admin() or exists (select 1 from public.teachers t where t.id = announcements.created_by and t.user_id = auth.uid())
    )
  )
  with check (
    school_id = user_school_id() and (
      is_school_admin() or exists (select 1 from public.teachers t where t.id = announcements.created_by and t.user_id = auth.uid())
    )
  );

-- media_assets: allow select within same school; writes by teachers/admins, parents cannot upload in MVP
create policy media_assets_select_school on public.media_assets for select
  to authenticated
  using (school_id = user_school_id());

create policy media_assets_insert_staff on public.media_assets for insert
  to authenticated
  with check (
    school_id = user_school_id() and (is_school_admin() or is_teacher())
  );

create policy media_assets_delete_staff on public.media_assets for delete
  to authenticated
  using (
    school_id = user_school_id() and (is_school_admin() or is_teacher())
  );
