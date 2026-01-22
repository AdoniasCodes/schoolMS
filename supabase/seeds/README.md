# ABOGIDA (FIDEL) Demo Seed Data

This folder contains SQL to seed realistic demo data across the MVP schema. Use it to test the app end-to-end.

## Files
- `001_demo_data.sql`: Inserts demo rows for schools, users, teachers, parents, students, classes, enrollments, attendance, daily updates, announcements, progress reports, messages, and media_assets references.

## Important
- Run seeds in the Supabase SQL editor (service/owner role) so Row Level Security (RLS) does not block writes.
- Replace placeholders in the file with your real Auth user IDs from your project:
  - `:ADMIN_UID:`
  - `:TEACHER1_UID:`
  - `:TEACHER2_UID:`
  - `:PARENT1_UID:`
  - `:PARENT2_UID:`
- The script is idempotent where possible (uses `on conflict do nothing` or `upsert`). You can re-run safely.

## Quick Steps
1. Open Supabase Dashboard → SQL Editor
2. Open `001_demo_data.sql` locally and replace the UID placeholders with real UUIDs from `auth.users`
3. Paste the modified SQL into the editor and run
4. Verify with a few queries:
   - `select * from public.users order by role_key;`
   - `select * from public.classes;`
   - `select * from public.daily_updates order by created_at desc;`

## Notes
- `media_assets` rows reference storage paths but do not upload files. Use the app to upload or add objects via Storage if needed.
- Data is scoped to the primary demo school `Addis Sunrise Academy`. A second school is added to validate isolation.
- RLS policies are already stabilized in migrations 0004/0005 so `select` queries in the app should work after seeding if your signed-in user belongs to the same school.
