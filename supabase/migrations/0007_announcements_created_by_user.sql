-- Change announcements.created_by FK from teachers(id) to users(id)
-- so that school admins (who are not in teachers table) can create announcements.

ALTER TABLE public.announcements DROP CONSTRAINT announcements_created_by_fkey;

ALTER TABLE public.announcements
  ADD CONSTRAINT announcements_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;

-- Update RLS insert policy to allow admin or teacher to create
DROP POLICY IF EXISTS announcements_insert ON public.announcements;
CREATE POLICY announcements_insert ON public.announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    school_id = public.current_school_id()
    AND created_by = auth.uid()
    AND (public.is_school_admin() OR public.is_teacher())
  );

-- Update RLS update policy
DROP POLICY IF EXISTS announcements_update ON public.announcements;
CREATE POLICY announcements_update ON public.announcements
  FOR UPDATE TO authenticated
  USING (
    school_id = public.current_school_id()
    AND (created_by = auth.uid() OR public.is_school_admin())
  );
