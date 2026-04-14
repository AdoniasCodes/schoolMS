-- Migration 0014: Add super_admin role for founders
-- Super admin sees ALL schools, has school_id = NULL

-- 1. Add the role
INSERT INTO public.roles (key, label) VALUES ('super_admin', 'Super Admin')
ON CONFLICT (key) DO NOTHING;

-- 2. Helper function
CREATE OR REPLACE FUNCTION public.is_super_admin(u_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = u_id AND role_key = 'super_admin'
  );
$$;

-- ============================================================
-- 3. Update RLS policies to add super_admin bypass
-- ============================================================

-- SCHOOLS: super admin can see, create, and update all schools
DROP POLICY IF EXISTS schools_select ON public.schools;
CREATE POLICY schools_select ON public.schools FOR SELECT TO authenticated
USING (id = public.current_school_id() OR public.is_super_admin());

DROP POLICY IF EXISTS schools_insert ON public.schools;
CREATE POLICY schools_insert_any ON public.schools FOR INSERT TO authenticated
WITH CHECK (public.is_school_admin() OR public.is_super_admin());

DROP POLICY IF EXISTS schools_update ON public.schools;
CREATE POLICY schools_update_any ON public.schools FOR UPDATE TO authenticated
USING (public.is_school_admin() OR public.is_super_admin())
WITH CHECK (public.is_school_admin() OR public.is_super_admin());

-- USERS
DROP POLICY IF EXISTS users_select_self_or_admin_school ON public.users;
DROP POLICY IF EXISTS users_select_all ON public.users;
CREATE POLICY users_select_all ON public.users FOR SELECT TO authenticated
USING (
  id = auth.uid()
  OR public.is_super_admin()
  OR (public.is_school_admin() AND public.is_in_same_school(users.id))
);

DROP POLICY IF EXISTS users_update ON public.users;
CREATE POLICY users_update_any ON public.users FOR UPDATE TO authenticated
USING (id = auth.uid() OR public.is_super_admin())
WITH CHECK (id = auth.uid() OR public.is_super_admin());

-- TEACHERS
DROP POLICY IF EXISTS teachers_select_scope ON public.teachers;
CREATE POLICY teachers_select_scope ON public.teachers FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR user_id = auth.uid()
  OR school_id = public.current_school_id()
);

-- PARENTS
DROP POLICY IF EXISTS parents_select_scope ON public.parents;
CREATE POLICY parents_select_scope ON public.parents FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR user_id = auth.uid()
  OR school_id = public.current_school_id()
);

-- STUDENTS
DROP POLICY IF EXISTS students_select_scope ON public.students;
CREATE POLICY students_select_scope ON public.students FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR (
    school_id = public.current_school_id()
    AND (
      public.is_school_admin()
      OR public.is_teacher()
      OR public.is_parent()
    )
  )
);

-- CLASSES
DROP POLICY IF EXISTS classes_select_scope ON public.classes;
CREATE POLICY classes_select_scope ON public.classes FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR (
    school_id = public.current_school_id()
    AND (
      public.is_school_admin()
      OR teacher_id = public.current_teacher_id()
      OR public.is_parent()
    )
  )
);

-- ENROLLMENTS
DROP POLICY IF EXISTS enrollments_select_scope ON public.enrollments;
CREATE POLICY enrollments_select_scope ON public.enrollments FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR school_id = public.current_school_id()
);

-- ATTENDANCE
DROP POLICY IF EXISTS attendance_select_scope ON public.attendance;
CREATE POLICY attendance_select_scope ON public.attendance FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR school_id = public.current_school_id()
);

-- DAILY UPDATES
DROP POLICY IF EXISTS daily_updates_select_scope ON public.daily_updates;
CREATE POLICY daily_updates_select_scope ON public.daily_updates FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR school_id = public.current_school_id()
);

-- MESSAGES
DROP POLICY IF EXISTS messages_select_participants ON public.messages;
CREATE POLICY messages_select_participants ON public.messages FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR (
    school_id = public.current_school_id()
    AND (
      parent_id = public.get_parent_id(auth.uid())
      OR teacher_id = public.get_teacher_id(auth.uid())
      OR public.is_school_admin(auth.uid())
    )
  )
);

-- PROGRESS REPORTS
DROP POLICY IF EXISTS progress_reports_select_scope ON public.progress_reports;
CREATE POLICY progress_reports_select_scope ON public.progress_reports FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR school_id = public.current_school_id()
);

-- ANNOUNCEMENTS
DROP POLICY IF EXISTS announcements_select_scope ON public.announcements;
CREATE POLICY announcements_select_scope ON public.announcements FOR SELECT TO authenticated
USING (
  deleted_at IS NULL
  AND (
    public.is_super_admin()
    OR (
      school_id = public.current_school_id()
      AND (
        public.is_school_admin(auth.uid())
        OR public.is_teacher(auth.uid())
        OR (
          class_id IS NULL
          AND NOT EXISTS (
            SELECT 1 FROM public.announcement_recipients ar WHERE ar.announcement_id = announcements.id
          )
        )
        OR EXISTS (
          SELECT 1 FROM public.enrollments e
          JOIN public.parent_students ps ON ps.student_id = e.student_id
          WHERE e.class_id = announcements.class_id
          AND ps.parent_id = public.get_parent_id(auth.uid())
        )
        OR EXISTS (
          SELECT 1 FROM public.announcement_recipients ar
          WHERE ar.announcement_id = announcements.id
          AND ar.parent_id = public.get_parent_id(auth.uid())
        )
      )
    )
  )
);

-- MEDIA ASSETS
DROP POLICY IF EXISTS media_assets_select_scope ON public.media_assets;
CREATE POLICY media_assets_select_scope ON public.media_assets FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR school_id = public.current_school_id()
);

-- ANNOUNCEMENT RECIPIENTS
DROP POLICY IF EXISTS announcement_recipients_select ON public.announcement_recipients;
CREATE POLICY announcement_recipients_select ON public.announcement_recipients FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR (
    EXISTS (
      SELECT 1 FROM public.announcements a
      WHERE a.id = announcement_recipients.announcement_id
      AND a.school_id = public.current_school_id()
    )
    AND (
      public.is_school_admin(auth.uid())
      OR public.is_teacher(auth.uid())
      OR parent_id = public.get_parent_id(auth.uid())
    )
  )
);

-- PARENT_STUDENTS
DROP POLICY IF EXISTS parent_students_select ON public.parent_students;
CREATE POLICY parent_students_select ON public.parent_students FOR SELECT TO authenticated
USING (
  public.is_super_admin()
  OR EXISTS (
    SELECT 1 FROM public.parents p WHERE p.id = parent_students.parent_id AND p.school_id = public.current_school_id()
  )
);
