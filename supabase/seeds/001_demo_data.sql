-- ABOGIDA (FIDEL) Demo Seed Data (MVP)
-- Run this in the Supabase SQL editor as an owner/service role.
-- BEFORE RUNNING: Replace the placeholders below with real auth.user IDs from your project.
-- REQUIRED AUTH USER IDS
--   :ADMIN_UID:   -> School admin auth UID (e.g., a3ad82ef-3f2e-4eea-a7bf-f3810f6245ce)
--   :TEACHER1_UID:
--   :TEACHER2_UID:
--   :PARENT1_UID:
--   :PARENT2_UID:

-- SAFETY: create or reuse one primary school and an optional second school to validate isolation
with s1 as (
  insert into public.schools (name, address, phone)
  values ('Addis Sunrise Academy', 'Addis Ababa, Ethiopia', '+251-11-000-0000')
  on conflict (name) do nothing
  returning id
), s2 as (
  insert into public.schools (name)
  values ('Bahir Dar Lakeside School')
  on conflict (name) do nothing
  returning id
)
select 1;

-- Resolve school ids
with sid as (
  select id from public.schools where name = 'Addis Sunrise Academy' limit 1
), sid2 as (
  select id from public.schools where name = 'Bahir Dar Lakeside School' limit 1
)
select 1;

-- USERS: upsert profiles for admin, teachers, parents into the primary school
-- Replace placeholders with real auth user IDs
insert into public.users (id, role_key, school_id, full_name, language_preference)
select ':ADMIN_UID:'::uuid, 'school_admin', (select id from public.schools where name='Addis Sunrise Academy'), 'Admin Martha', 'en'
union all
select ':TEACHER1_UID:'::uuid, 'teacher', (select id from public.schools where name='Addis Sunrise Academy'), 'Teacher Dawit', 'en'
union all
select ':TEACHER2_UID:'::uuid, 'teacher', (select id from public.schools where name='Addis Sunrise Academy'), 'Teacher Selam', 'am'
union all
select ':PARENT1_UID:'::uuid, 'parent', (select id from public.schools where name='Addis Sunrise Academy'), 'Parent Hana', 'en'
union all
select ':PARENT2_UID:'::uuid, 'parent', (select id from public.schools where name='Addis Sunrise Academy'), 'Parent Bekele', 'am'
ON CONFLICT (id) DO UPDATE SET
  role_key = EXCLUDED.role_key,
  school_id = EXCLUDED.school_id,
  full_name = EXCLUDED.full_name,
  language_preference = EXCLUDED.language_preference;

-- TEACHERS/PARENTS specialization
insert into public.teachers (user_id, school_id)
select ':TEACHER1_UID:'::uuid, (select id from public.schools where name='Addis Sunrise Academy')
union all
select ':TEACHER2_UID:'::uuid, (select id from public.schools where name='Addis Sunrise Academy')
on conflict (user_id) do nothing;

insert into public.parents (user_id, school_id)
select ':PARENT1_UID:'::uuid, (select id from public.schools where name='Addis Sunrise Academy')
union all
select ':PARENT2_UID:'::uuid, (select id from public.schools where name='Addis Sunrise Academy')
on conflict (user_id) do nothing;

-- Fetch teacher IDs for later
-- (use CTEs to avoid ambiguity)
with t as (
  select id as t1_id from public.teachers where user_id = ':TEACHER1_UID:'::uuid
), t2 as (
  select id as t2_id from public.teachers where user_id = ':TEACHER2_UID:'::uuid
)
select 1;

-- STUDENTS (4 students)
insert into public.students (id, school_id, first_name, last_name, date_of_birth)
values
  (gen_random_uuid(), (select id from public.schools where name='Addis Sunrise Academy'), 'Abel', 'Mekonnen', '2016-03-15'),
  (gen_random_uuid(), (select id from public.schools where name='Addis Sunrise Academy'), 'Sara', 'Kebede', '2015-11-02'),
  (gen_random_uuid(), (select id from public.schools where name='Addis Sunrise Academy'), 'Yonatan', 'Bekele', '2014-07-22'),
  (gen_random_uuid(), (select id from public.schools where name='Addis Sunrise Academy'), 'Marta', 'Tesfaye', '2016-09-08')
returning id into transient students_added;
-- NOTE: the above RETURNING into transient variable is illustrative; not all SQL editors support this.
-- We will instead re-select by names below where needed.

-- PARENT-STUDENT LINKS
-- Parent1 linked to Abel and Sara; Parent2 linked to Yonatan and Marta
insert into public.parent_students (parent_id, student_id, relation)
select p.id, s.id, 'mother'
from public.parents p
join public.users u on u.id = p.user_id and u.id = ':PARENT1_UID:'::uuid
join public.students s on s.first_name in ('Abel','Sara') and s.school_id = p.school_id
on conflict do nothing;

insert into public.parent_students (parent_id, student_id, relation)
select p.id, s.id, 'father'
from public.parents p
join public.users u on u.id = p.user_id and u.id = ':PARENT2_UID:'::uuid
join public.students s on s.first_name in ('Yonatan','Marta') and s.school_id = p.school_id
on conflict do nothing;

-- CLASSES (two classes, one per teacher)
insert into public.classes (school_id, name, grade_level, teacher_id)
select s.id, 'Grade 1 - A', '1', t.id
from public.schools s, public.teachers t
join public.users u on u.id = t.user_id and u.id = ':TEACHER1_UID:'::uuid
where s.name = 'Addis Sunrise Academy'
union all
select s.id, 'Grade 2 - B', '2', t.id
from public.schools s, public.teachers t
join public.users u on u.id = t.user_id and u.id = ':TEACHER2_UID:'::uuid
where s.name = 'Addis Sunrise Academy'
on conflict do nothing;

-- ENROLLMENTS (put 2 students per class)
-- Grade 1 - A: Abel, Sara
-- Grade 2 - B: Yonatan, Marta
insert into public.enrollments (school_id, class_id, student_id)
select c.school_id, c.id, s.id
from public.classes c
join public.students s on s.first_name in ('Abel','Sara') and s.school_id = c.school_id
where c.name = 'Grade 1 - A'
on conflict do nothing;

insert into public.enrollments (school_id, class_id, student_id)
select c.school_id, c.id, s.id
from public.classes c
join public.students s on s.first_name in ('Yonatan','Marta') and s.school_id = c.school_id
where c.name = 'Grade 2 - B'
on conflict do nothing;

-- ATTENDANCE (last 3 school days)
with dates(d) as (
  values (current_date - 2), (current_date - 1), (current_date)
)
insert into public.attendance (school_id, class_id, student_id, date, status, notes, created_by)
select c.school_id, c.id, s.id, d.d, 
       (case when random() < 0.85 then 'present' else 'absent' end)::text as status,
       null as notes,
       c.teacher_id as created_by
from public.classes c
join public.enrollments e on e.class_id = c.id and e.school_id = c.school_id
join public.students s on s.id = e.student_id
join dates d on true
on conflict (class_id, student_id, date) do nothing;

-- DAILY UPDATES (a few posts per class)
insert into public.daily_updates (school_id, class_id, teacher_id, text_content)
select c.school_id, c.id, c.teacher_id, 'Welcome back! Today we focused on reading practice.'
from public.classes c where c.name = 'Grade 1 - A'
union all
select c.school_id, c.id, c.teacher_id, 'Math revision: addition and subtraction drills.'
from public.classes c where c.name = 'Grade 1 - A'
union all
select c.school_id, c.id, c.teacher_id, 'Science: explored plant parts and functions.'
from public.classes c where c.name = 'Grade 2 - B'
union all
select c.school_id, c.id, c.teacher_id, 'Arts & crafts: making colorful shapes.'
from public.classes c where c.name = 'Grade 2 - B';

-- ANNOUNCEMENTS (school-wide and class-level)
insert into public.announcements (school_id, class_id, title, body, created_by)
select c.school_id, null, 'School Closed Friday', 'School will be closed this Friday for maintenance.', c.teacher_id
from public.classes c where c.name = 'Grade 1 - A'
union all
select c.school_id, c.id, 'Field Trip Reminder', 'Field trip to the museum next week. Consent forms due Monday.', c.teacher_id
from public.classes c where c.name = 'Grade 2 - B';

-- PROGRESS REPORTS (one per student)
insert into public.progress_reports (school_id, student_id, teacher_id, term_label, summary, metrics)
select c.school_id, s.id, c.teacher_id, '2026 Term 1', 'Strong participation; needs math practice.', jsonb_build_object('reading', 'B', 'math', 'C', 'behavior', 'A')
from public.classes c
join public.enrollments e on e.class_id = c.id and e.school_id = c.school_id
join public.students s on s.id = e.student_id
on conflict do nothing;

-- MESSAGES (parent-teacher; scoped to a student)
insert into public.messages (school_id, parent_id, teacher_id, student_id, text_content)
select p.school_id, p.id, c.teacher_id, s.id, 'Hello teacher, how is my child doing today?'
from public.parents p
join public.users up on up.id = p.user_id and up.id = ':PARENT1_UID:'::uuid
join public.parent_students ps on ps.parent_id = p.id
join public.students s on s.id = ps.student_id
join public.enrollments e on e.student_id = s.id and e.school_id = p.school_id
join public.classes c on c.id = e.class_id
limit 2;

-- MEDIA ASSETS (DB references only; storage upload not included in seed)
-- Use a conventional path that matches our planned naming scheme
insert into public.media_assets (school_id, bucket, object_path, mime_type, file_size_bytes, uploaded_by, daily_update_id)
select c.school_id, 'media', concat('school_', c.school_id::text, '/daily_updates/', du.id::text, '/photo1.jpg'), 'image/jpeg', 123456, u.id, du.id
from public.daily_updates du
join public.classes c on c.id = du.class_id
join public.users u on u.role_key = 'teacher' and u.school_id = c.school_id
limit 2;

-- BASIC VERIFICATION QUERIES (optional)
-- select count(*) from public.students;
-- select count(*) from public.enrollments;
-- select count(*) from public.attendance;
-- select count(*) from public.daily_updates;
-- select count(*) from public.progress_reports;
-- select count(*) from public.announcements;
-- select count(*) from public.messages;
-- select * from public.users order by role_key;
