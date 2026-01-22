-- ABOGIDA (FIDEL) - Sync script based on your current Supabase state
-- PURPOSE: Bring data into a healthy, testable baseline using the 4 UIDs and school_id you provided.
-- SAFE/IDEMPOTENT: uses upsert or on conflict guards.
-- RUN in Supabase SQL Editor (service/owner role).

-- Replace these with your actual values before executing:
-- :SCHOOL_ID:       -> 35516a0e-8583-408f-8d1f-17e902241b22
-- :ADMIN_UID:       -> a3ad82ef-3f2e-4eea-a7bf-f3810f6245ce
-- :TEACHER2_UID:    -> a1250b10-d6cf-4eb4-a419-ff827851722d
-- :PARENT1_UID:     -> 0a695ec7-3ee0-4e15-b627-1501cb562dae
-- :PARENT2_UID:     -> 83e886ea-b53d-4fef-a227-901a670f7123

-- =============================
-- PHASE 1 — Populate public.users
-- =============================
insert into public.users (id, role_key, full_name, school_id, language_preference)
values
  (':ADMIN_UID:'::uuid,    'school_admin', 'Admin User', :SCHOOL_ID::uuid, 'en'),
  (':TEACHER2_UID:'::uuid, 'teacher',      'Dave Crown', :SCHOOL_ID::uuid, 'en'),
  (':PARENT1_UID:'::uuid,  'parent',       'Dawit Zewdu', :SCHOOL_ID::uuid, 'en'),
  (':PARENT2_UID:'::uuid,  'parent',       'Panda King', :SCHOOL_ID::uuid, 'en')
on conflict (id) do update set
  role_key = excluded.role_key,
  full_name = excluded.full_name,
  school_id = excluded.school_id,
  language_preference = excluded.language_preference;

-- =============================
-- PHASE 2 — Role specializations
-- =============================
insert into public.teachers (user_id, school_id)
values (':TEACHER2_UID:'::uuid, :SCHOOL_ID::uuid)
on conflict (user_id) do nothing;

insert into public.parents (user_id, school_id)
values
  (':PARENT1_UID:'::uuid, :SCHOOL_ID::uuid),
  (':PARENT2_UID:'::uuid, :SCHOOL_ID::uuid)
on conflict (user_id) do nothing;

-- =============================
-- PHASE 3 — Classes (ensure unique and insert Grade 2 - B)
-- =============================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'classes_school_name_unique'
  ) THEN
    ALTER TABLE public.classes
    ADD CONSTRAINT classes_school_name_unique UNIQUE (school_id, name);
  END IF;
END $$;

insert into public.classes (school_id, name, grade_level, teacher_id)
select
  :SCHOOL_ID::uuid,
  'Grade 2 - B',
  '2',
  t.id
from public.teachers t
join public.users u on u.id = t.user_id and u.id = ':TEACHER2_UID:'::uuid
on conflict on constraint classes_school_name_unique do nothing;

-- =============================
-- PHASE 4 — Students
-- =============================
insert into public.students (first_name, last_name, school_id)
values
  ('Liam', 'Tesfaye', :SCHOOL_ID::uuid),
  ('Sara', 'Bekele',  :SCHOOL_ID::uuid)
on conflict do nothing;

-- =============================
-- PHASE 5 — Enrollments (enroll into Grade 2 - B)
-- =============================
insert into public.enrollments (id, school_id, class_id, student_id)
select gen_random_uuid(), c.school_id, c.id, s.id
from public.classes c
join public.students s on s.school_id = c.school_id and s.first_name in ('Liam','Sara')
where c.school_id = :SCHOOL_ID::uuid and c.name = 'Grade 2 - B'
on conflict (class_id, student_id) do nothing;

-- Optionally also enroll into Grade 1 - A if it exists (safe no-op if absent)
insert into public.enrollments (id, school_id, class_id, student_id)
select gen_random_uuid(), c.school_id, c.id, s.id
from public.classes c
join public.students s on s.school_id = c.school_id and s.first_name in ('Liam','Sara')
where c.school_id = :SCHOOL_ID::uuid and c.name = 'Grade 1 - A'
on conflict (class_id, student_id) do nothing;

-- =============================
-- PHASE 6 — Validation
-- =============================
-- Users breakdown
select role_key, count(*) from public.users group by role_key order by role_key;

-- Teachers/Parents overview
select t.id as teacher_id, u.full_name from public.teachers t join public.users u on u.id = t.user_id order by u.full_name;
select p.id as parent_id, u.full_name from public.parents p join public.users u on u.id = p.user_id order by u.full_name;

-- Classes
select id, name, grade_level from public.classes where school_id = :SCHOOL_ID::uuid order by name;

-- Enrollments summary
select c.name as class, count(e.id) as students
from public.enrollments e
join public.classes c on c.id = e.class_id
where c.school_id = :SCHOOL_ID::uuid
group by c.name
order by c.name;
