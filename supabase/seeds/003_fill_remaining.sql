-- ABOGIDA (FIDEL) - Fill remaining demo data after initial sync
-- PURPOSE: Populate parent-student links, attendance for recent days, daily updates,
-- announcements, progress reports, and a couple of messages, using the existing school/users.
-- SAFE/IDEMPOTENT: guarded by on conflict or natural uniqueness.
-- RUN in Supabase SQL Editor (service/owner role).

-- Replace with your school id if different
-- :SCHOOL_ID: -> 35516a0e-8583-408f-8d1f-17e902241b22

-- Resolve key ids from names/roles where possible
with school as (
  select id as school_id from public.schools where id = :SCHOOL_ID::uuid
), t as (
  select t.id as teacher_id, u.full_name
  from public.teachers t
  join public.users u on u.id = t.user_id
  where u.school_id = :SCHOOL_ID::uuid
), c as (
  select id as class_id, name, teacher_id, school_id from public.classes where school_id = :SCHOOL_ID::uuid
), s as (
  select id as student_id, first_name, last_name from public.students where school_id = :SCHOOL_ID::uuid
), p as (
  select p.id as parent_id, u.full_name
  from public.parents p
  join public.users u on u.id = p.user_id
  where u.school_id = :SCHOOL_ID::uuid
)
select 1;

-- Parent-student links (link first two students to first parent, next two to second parent)
insert into public.parent_students (parent_id, student_id, relation)
select p.parent_id, s.student_id, 'guardian'
from (
  select parent_id, row_number() over (order by parent_id) as rn from p
) p
join (
  select student_id, row_number() over (order by student_id) as rn from s
) s on ( (p.rn = 1 and s.rn in (1,2)) or (p.rn = 2 and s.rn in (3,4)) )
on conflict do nothing;

-- Attendance for last 3 days across all enrollments
with dates(d) as (
  values (current_date - 2), (current_date - 1), (current_date)
)
insert into public.attendance (school_id, class_id, student_id, date, status, notes, created_by)
select c.school_id, e.class_id, e.student_id, d.d,
       (case when random() < 0.9 then 'present' else 'absent' end)::text,
       null,
       c.teacher_id
from dates d
join public.enrollments e on true
join public.classes c on c.id = e.class_id and c.school_id = :SCHOOL_ID::uuid
on conflict (class_id, student_id, date) do nothing;

-- Daily Updates: one per class
insert into public.daily_updates (school_id, class_id, teacher_id, text_content)
select c.school_id, c.class_id, c.teacher_id, concat('Update for ', c.name, ': Great progress today!')
from c
on conflict do nothing;

-- Announcements: school-wide + class level
insert into public.announcements (school_id, class_id, title, body, created_by)
select :SCHOOL_ID::uuid, null, 'Reminder: PTA Meeting', 'PTA meeting on Friday at 3PM.', (select teacher_id from t limit 1)
on conflict do nothing;

insert into public.announcements (school_id, class_id, title, body, created_by)
select c.school_id, c.class_id, concat('Class ', c.name, ' — Materials'), 'Please bring notebooks and pencils tomorrow.', c.teacher_id
from c
on conflict do nothing;

-- Progress reports: create for each enrolled student (single term label)
insert into public.progress_reports (school_id, student_id, teacher_id, term_label, summary, metrics)
select c.school_id, e.student_id, c.teacher_id, '2026 Term 1', 'Consistent improvement observed.', jsonb_build_object('reading','B','math','B','behavior','A')
from public.enrollments e
join public.classes c on c.id = e.class_id and c.school_id = :SCHOOL_ID::uuid
on conflict do nothing;

-- Messages: create 2 per first parent/student pair
with ps as (
  select ps.parent_id, ps.student_id
  from public.parent_students ps
  join public.students s on s.id = ps.student_id and s.school_id = :SCHOOL_ID::uuid
  order by ps.parent_id, ps.student_id
  limit 1
), cls as (
  select e.class_id, c.teacher_id
  from ps
  join public.enrollments e on e.student_id = ps.student_id
  join public.classes c on c.id = e.class_id
  limit 1
)
insert into public.messages (school_id, parent_id, teacher_id, student_id, text_content)
select :SCHOOL_ID::uuid, ps.parent_id, cls.teacher_id, ps.student_id, 'Hello, how was participation today?'
from ps, cls
union all
select :SCHOOL_ID::uuid, ps.parent_id, cls.teacher_id, ps.student_id, 'Great participation, thanks for asking!'
from ps, cls;

-- Media assets references (no file uploads)
insert into public.media_assets (school_id, bucket, object_path, mime_type, file_size_bytes, uploaded_by, daily_update_id)
select du.school_id, 'media', concat('school_', du.school_id::text, '/daily_updates/', du.id::text, '/photo.jpg'), 'image/jpeg', 245678,
       (select id from public.users where school_id = :SCHOOL_ID::uuid and role_key = 'teacher' limit 1), du.id
from public.daily_updates du
where du.school_id = :SCHOOL_ID::uuid
on conflict do nothing;

-- Verification (optional)
-- select count(*) from public.parent_students;
-- select count(*) from public.attendance;
-- select count(*) from public.daily_updates;
-- select count(*) from public.announcements;
-- select count(*) from public.progress_reports;
-- select count(*) from public.messages;
