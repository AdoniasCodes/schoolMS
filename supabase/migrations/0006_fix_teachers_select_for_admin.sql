-- Fix teachers SELECT policy to allow same-school reads
-- Previously restricted to user_id = auth.uid() only (self),
-- which broke: admin viewing teachers, teacher dropdowns in forms,
-- and RLS chain lookups in students/classes policies.

DROP POLICY IF EXISTS teachers_select ON public.teachers;

CREATE POLICY teachers_select ON public.teachers
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR school_id = public.current_school_id()
  );
