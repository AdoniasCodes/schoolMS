-- ABOGIDA (FIDEL) - Initial Schema Migration
-- Notes: Supabase Postgres. Uses gen_random_uuid(). Ensure pgcrypto extension is enabled in your project.

-- Extensions (safe-guard)
create extension if not exists pgcrypto;

-- 1) Roles lookup
create table if not exists public.roles (
  key text primary key,
  label text not null
);
insert into public.roles (key, label)
  values ('school_admin','School Admin'), ('teacher','Teacher'), ('parent','Parent')
  on conflict (key) do nothing;

-- 2) Schools
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- 3) Users (extends auth.users)
-- Mirrors auth.users.id as PK, with role and profile fields
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  role_key text not null references public.roles(key),
  school_id uuid references public.schools(id) on delete set null,
  full_name text,
  language_preference text not null default 'en', -- 'en' | 'am'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_users_school on public.users(school_id);

-- 4) Teachers & Parents (specializations)
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_teachers_school on public.teachers(school_id);

create table if not exists public.parents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_parents_school on public.parents(school_id);

-- 5) Students
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  date_of_birth date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_students_school on public.students(school_id);

-- 6) Parent-Student linking (many-to-many)
create table if not exists public.parent_students (
  parent_id uuid not null references public.parents(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  relation text, -- e.g., mother, father, guardian
  created_at timestamptz not null default now(),
  primary key (parent_id, student_id)
);

-- 7) Classes
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  name text not null,
  grade_level text,
  teacher_id uuid references public.teachers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_classes_school on public.classes(school_id);
create index if not exists idx_classes_teacher on public.classes(teacher_id);

-- 8) Enrollments (students in classes)
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (class_id, student_id)
);
create index if not exists idx_enrollments_school on public.enrollments(school_id);
create index if not exists idx_enrollments_class on public.enrollments(class_id);
create index if not exists idx_enrollments_student on public.enrollments(student_id);

-- 9) Attendance (per student per date per class)
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  date date not null,
  status text not null check (status in ('present','absent','late','excused')),
  notes text,
  created_by uuid not null references public.teachers(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (class_id, student_id, date)
);
create index if not exists idx_attendance_school on public.attendance(school_id);
create index if not exists idx_attendance_class on public.attendance(class_id);
create index if not exists idx_attendance_student on public.attendance(student_id);

-- 10) Daily Updates (feed posts)
create table if not exists public.daily_updates (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  text_content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_daily_updates_school on public.daily_updates(school_id);
create index if not exists idx_daily_updates_class on public.daily_updates(class_id);

-- 11) Messages (1:1 Parent-Teacher)
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  parent_id uuid not null references public.parents(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  student_id uuid references public.students(id) on delete set null,
  class_id uuid references public.classes(id) on delete set null,
  text_content text not null,
  created_at timestamptz not null default now(),
  -- Either student_id or class_id must be provided
  constraint messages_scope_chk check (
    (student_id is not null and class_id is null) or (student_id is null and class_id is not null)
  )
);
create index if not exists idx_messages_school on public.messages(school_id);
create index if not exists idx_messages_parent on public.messages(parent_id);
create index if not exists idx_messages_teacher on public.messages(teacher_id);
create index if not exists idx_messages_student on public.messages(student_id);
create index if not exists idx_messages_class on public.messages(class_id);

-- 12) Progress Reports
create table if not exists public.progress_reports (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  term_label text not null, -- e.g., "2025 Term 1"
  summary text,
  metrics jsonb, -- structured values (scores/levels)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_progress_reports_school on public.progress_reports(school_id);
create index if not exists idx_progress_reports_student on public.progress_reports(student_id);

-- 13) Announcements
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null, -- null => school-wide
  title text not null,
  body text,
  created_by uuid not null references public.teachers(id) on delete restrict, -- admins/teachers; will handle via RLS
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_announcements_school on public.announcements(school_id);
create index if not exists idx_announcements_class on public.announcements(class_id);

-- 14) Media Assets (storage references)
create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  bucket text not null default 'media',
  object_path text not null, -- path inside bucket
  mime_type text,
  file_size_bytes bigint,
  uploaded_by uuid references public.users(id) on delete set null,
  -- Ownership targets (nullable FKs)
  daily_update_id uuid references public.daily_updates(id) on delete cascade,
  progress_report_id uuid references public.progress_reports(id) on delete cascade,
  announcement_id uuid references public.announcements(id) on delete cascade,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_media_school on public.media_assets(school_id);
create index if not exists idx_media_update on public.media_assets(daily_update_id);
create index if not exists idx_media_report on public.media_assets(progress_report_id);
create index if not exists idx_media_announcement on public.media_assets(announcement_id);

-- 15) Updated_at triggers
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Attach to tables that have updated_at
create or replace function public.add_updated_at_trigger(tbl regclass) returns void as $$
begin
  execute format('create trigger set_updated_at before update on %s for each row execute function public.set_updated_at();', tbl);
end; $$ language plpgsql;

-- Apply triggers
select public.add_updated_at_trigger('public.schools');
select public.add_updated_at_trigger('public.users');
select public.add_updated_at_trigger('public.teachers');
select public.add_updated_at_trigger('public.parents');
select public.add_updated_at_trigger('public.students');
select public.add_updated_at_trigger('public.classes');
select public.add_updated_at_trigger('public.enrollments');
select public.add_updated_at_trigger('public.attendance');
select public.add_updated_at_trigger('public.daily_updates');
select public.add_updated_at_trigger('public.progress_reports');
select public.add_updated_at_trigger('public.announcements');

-- RLS will be enabled and policies added in a subsequent migration.
