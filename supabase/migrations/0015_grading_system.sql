-- Migration 0015: Grading System
-- Adds subjects, class-subject-teacher assignments, assessment types, grades, and grade exemptions
-- Supports Ethiopian curriculum with predefined subjects per grade level

-- ============================================================
-- 1. SUBJECTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  name_am text,
  grade_levels text[] NOT NULL DEFAULT '{}',
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE(school_id, name)
);
CREATE INDEX IF NOT EXISTS idx_subjects_school ON public.subjects(school_id);

-- ============================================================
-- 2. CLASS-SUBJECT-TEACHER ASSIGNMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.class_subject_teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(class_id, subject_id)
);
CREATE INDEX IF NOT EXISTS idx_cst_school ON public.class_subject_teachers(school_id);
CREATE INDEX IF NOT EXISTS idx_cst_class ON public.class_subject_teachers(class_id);
CREATE INDEX IF NOT EXISTS idx_cst_teacher ON public.class_subject_teachers(teacher_id);

-- ============================================================
-- 3. ASSESSMENT TYPES (per school per term)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.assessment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  weight numeric(5,2) NOT NULL CHECK (weight > 0 AND weight <= 100),
  term_label text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_assessment_types_school ON public.assessment_types(school_id);

-- ============================================================
-- 4. GRADES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
  assessment_type_id uuid NOT NULL REFERENCES public.assessment_types(id) ON DELETE CASCADE,
  term_label text NOT NULL,
  score numeric(5,2) NOT NULL CHECK (score >= 0 AND score <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject_id, assessment_type_id, term_label)
);
CREATE INDEX IF NOT EXISTS idx_grades_school ON public.grades(school_id);
CREATE INDEX IF NOT EXISTS idx_grades_class ON public.grades(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_student ON public.grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher ON public.grades(teacher_id);

-- ============================================================
-- 5. GRADE EXEMPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.grade_exemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  term_label text NOT NULL,
  teacher_id uuid NOT NULL REFERENCES public.teachers(id) ON DELETE RESTRICT,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, subject_id, term_label)
);
CREATE INDEX IF NOT EXISTS idx_grade_exemptions_school ON public.grade_exemptions(school_id);

-- ============================================================
-- 6. UPDATED_AT TRIGGERS
-- ============================================================
CREATE TRIGGER set_subjects_updated_at BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_assessment_types_updated_at BEFORE UPDATE ON public.assessment_types
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_grades_updated_at BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 7. RLS POLICIES
-- ============================================================
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_subject_teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_exemptions ENABLE ROW LEVEL SECURITY;

-- SUBJECTS
CREATE POLICY subjects_select ON public.subjects FOR SELECT TO authenticated
  USING (public.is_super_admin() OR school_id = public.current_school_id());

CREATE POLICY subjects_insert ON public.subjects FOR INSERT TO authenticated
  WITH CHECK ((public.is_school_admin() AND school_id = public.current_school_id()) OR public.is_super_admin());

CREATE POLICY subjects_update ON public.subjects FOR UPDATE TO authenticated
  USING ((public.is_school_admin() AND school_id = public.current_school_id()) OR public.is_super_admin());

CREATE POLICY subjects_delete ON public.subjects FOR DELETE TO authenticated
  USING ((public.is_school_admin() AND school_id = public.current_school_id()) OR public.is_super_admin());

-- CLASS_SUBJECT_TEACHERS
CREATE POLICY cst_select ON public.class_subject_teachers FOR SELECT TO authenticated
  USING (public.is_super_admin() OR school_id = public.current_school_id());

CREATE POLICY cst_insert ON public.class_subject_teachers FOR INSERT TO authenticated
  WITH CHECK ((public.is_school_admin() AND school_id = public.current_school_id()) OR public.is_super_admin());

CREATE POLICY cst_update ON public.class_subject_teachers FOR UPDATE TO authenticated
  USING ((public.is_school_admin() AND school_id = public.current_school_id()) OR public.is_super_admin());

CREATE POLICY cst_delete ON public.class_subject_teachers FOR DELETE TO authenticated
  USING ((public.is_school_admin() AND school_id = public.current_school_id()) OR public.is_super_admin());

-- ASSESSMENT_TYPES
CREATE POLICY at_select ON public.assessment_types FOR SELECT TO authenticated
  USING (public.is_super_admin() OR school_id = public.current_school_id());

CREATE POLICY at_insert ON public.assessment_types FOR INSERT TO authenticated
  WITH CHECK ((public.is_school_admin() AND school_id = public.current_school_id()) OR public.is_super_admin());

CREATE POLICY at_update ON public.assessment_types FOR UPDATE TO authenticated
  USING ((public.is_school_admin() AND school_id = public.current_school_id()) OR public.is_super_admin());

CREATE POLICY at_delete ON public.assessment_types FOR DELETE TO authenticated
  USING ((public.is_school_admin() AND school_id = public.current_school_id()) OR public.is_super_admin());

-- GRADES
CREATE POLICY grades_select ON public.grades FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (school_id = public.current_school_id() AND (
      public.is_school_admin()
      OR teacher_id = public.current_teacher_id()
      OR EXISTS (
        SELECT 1 FROM public.parent_students ps
        JOIN public.parents p ON p.id = ps.parent_id
        WHERE ps.student_id = grades.student_id
          AND p.user_id = auth.uid()
      )
    ))
  );

CREATE POLICY grades_insert ON public.grades FOR INSERT TO authenticated
  WITH CHECK (
    school_id = public.current_school_id()
    AND teacher_id = public.current_teacher_id()
    AND EXISTS (
      SELECT 1 FROM public.class_subject_teachers cst
      WHERE cst.class_id = grades.class_id
        AND cst.subject_id = grades.subject_id
        AND cst.teacher_id = public.current_teacher_id()
    )
  );

CREATE POLICY grades_update ON public.grades FOR UPDATE TO authenticated
  USING (
    school_id = public.current_school_id()
    AND teacher_id = public.current_teacher_id()
  );

-- GRADE_EXEMPTIONS
CREATE POLICY ge_select ON public.grade_exemptions FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR (school_id = public.current_school_id() AND (
      public.is_school_admin()
      OR teacher_id = public.current_teacher_id()
      OR EXISTS (
        SELECT 1 FROM public.parent_students ps
        JOIN public.parents p ON p.id = ps.parent_id
        WHERE ps.student_id = grade_exemptions.student_id
          AND p.user_id = auth.uid()
      )
    ))
  );

CREATE POLICY ge_insert ON public.grade_exemptions FOR INSERT TO authenticated
  WITH CHECK (
    school_id = public.current_school_id()
    AND teacher_id = public.current_teacher_id()
  );

CREATE POLICY ge_update ON public.grade_exemptions FOR UPDATE TO authenticated
  USING (
    school_id = public.current_school_id()
    AND teacher_id = public.current_teacher_id()
  );

CREATE POLICY ge_delete ON public.grade_exemptions FOR DELETE TO authenticated
  USING (
    school_id = public.current_school_id()
    AND teacher_id = public.current_teacher_id()
  );

-- ============================================================
-- 8. SEED DEFAULT SUBJECTS FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_default_subjects(p_school_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- KG subjects
  INSERT INTO public.subjects (school_id, name, name_am, grade_levels, is_default) VALUES
    (p_school_id, 'Amharic', 'አማርኛ', ARRAY['KG','1','2','3','4','5','6','7','8'], true),
    (p_school_id, 'English', 'እንግሊዝኛ', ARRAY['KG','1','2','3','4','5','6','7','8'], true),
    (p_school_id, 'Mathematics', 'ሒሳብ', ARRAY['KG','1','2','3','4','5','6','7','8'], true),
    (p_school_id, 'Environmental Science', 'የአካባቢ ሳይንስ', ARRAY['KG','1','2','3','4'], true),
    (p_school_id, 'Art', 'ስነ ጥበብ', ARRAY['KG','1','2','3','4'], true),
    (p_school_id, 'Civics', 'ዜግነት', ARRAY['1','2','3','4','5','6','7','8'], true),
    (p_school_id, 'Physical Education', 'አካላዊ ትምህርት', ARRAY['1','2','3','4','5','6','7','8'], true),
    (p_school_id, 'Biology', 'ስነ ህይወት', ARRAY['5','6','7','8'], true),
    (p_school_id, 'Chemistry', 'ኬሚስትሪ', ARRAY['5','6','7','8'], true),
    (p_school_id, 'Physics', 'ፊዚክስ', ARRAY['5','6','7','8'], true),
    (p_school_id, 'History', 'ታሪክ', ARRAY['5','6','7','8'], true),
    (p_school_id, 'Geography', 'ጂኦግራፊ', ARRAY['5','6','7','8'], true),
    (p_school_id, 'ICT', 'አይሲቲ', ARRAY['5','6','7','8'], true)
  ON CONFLICT (school_id, name) DO NOTHING;
END;
$$;
