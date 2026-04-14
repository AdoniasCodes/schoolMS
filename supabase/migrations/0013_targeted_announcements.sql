-- Migration 0013: Targeted announcements — send to specific parents
-- When announcement_recipients has rows, only those parents see the announcement.
-- When no rows exist, falls back to existing class/school scope.

CREATE TABLE IF NOT EXISTS public.announcement_recipients (
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES public.parents(id) ON DELETE CASCADE,
  PRIMARY KEY (announcement_id, parent_id)
);

ALTER TABLE public.announcement_recipients ENABLE ROW LEVEL SECURITY;

-- Admin/teacher can see all recipients in their school
CREATE POLICY announcement_recipients_select ON public.announcement_recipients
  FOR SELECT TO authenticated
  USING (
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
  );

-- Admin/teacher can manage recipients
CREATE POLICY announcement_recipients_insert ON public.announcement_recipients
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_school_admin(auth.uid()) OR public.is_teacher(auth.uid())
  );

CREATE POLICY announcement_recipients_delete ON public.announcement_recipients
  FOR DELETE TO authenticated
  USING (
    public.is_school_admin(auth.uid()) OR public.is_teacher(auth.uid())
  );

-- Update announcements SELECT policy to support targeted visibility
DROP POLICY IF EXISTS announcements_select_scope ON public.announcements;
CREATE POLICY announcements_select_scope ON public.announcements
  FOR SELECT TO authenticated
  USING (
    school_id = public.current_school_id()
    AND deleted_at IS NULL
    AND (
      -- Admin and teacher see all
      public.is_school_admin(auth.uid())
      OR public.is_teacher(auth.uid())
      -- Parent sees: school-wide (no class, no targeted recipients)
      OR (
        class_id IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.announcement_recipients ar WHERE ar.announcement_id = announcements.id
        )
      )
      -- Parent sees: class-scoped (their child is enrolled in that class)
      OR EXISTS (
        SELECT 1 FROM public.enrollments e
        JOIN public.parent_students ps ON ps.student_id = e.student_id
        WHERE e.class_id = announcements.class_id
        AND ps.parent_id = public.get_parent_id(auth.uid())
      )
      -- Parent sees: they are a named recipient
      OR EXISTS (
        SELECT 1 FROM public.announcement_recipients ar
        WHERE ar.announcement_id = announcements.id
        AND ar.parent_id = public.get_parent_id(auth.uid())
      )
    )
  );
