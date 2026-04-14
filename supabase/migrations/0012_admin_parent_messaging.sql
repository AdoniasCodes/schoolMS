-- Migration 0012: Enable admin-to-parent direct messaging
-- Currently messages require teacher_id NOT NULL. Admins are not teachers.
-- This migration makes teacher_id nullable for admin conversations.

-- 1. Make teacher_id nullable
ALTER TABLE public.messages ALTER COLUMN teacher_id DROP NOT NULL;

-- 2. Relax the scope check constraint
-- Teacher conversations: still require student_id XOR class_id
-- Admin conversations (teacher_id IS NULL): student_id and class_id are optional
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_scope_chk;
ALTER TABLE public.messages ADD CONSTRAINT messages_scope_chk CHECK (
  (
    teacher_id IS NOT NULL
    AND (
      (student_id IS NOT NULL AND class_id IS NULL)
      OR (student_id IS NULL AND class_id IS NOT NULL)
    )
  )
  OR (
    teacher_id IS NULL
  )
);

-- 3. Update RLS SELECT policy — admin can see all school messages
DROP POLICY IF EXISTS messages_select_participants ON public.messages;
CREATE POLICY messages_select_participants ON public.messages
  FOR SELECT TO authenticated
  USING (
    school_id = public.current_school_id()
    AND (
      parent_id = public.get_parent_id(auth.uid())
      OR teacher_id = public.get_teacher_id(auth.uid())
      OR public.is_school_admin(auth.uid())
    )
  );

-- 4. Update RLS INSERT policy — admin can send messages
DROP POLICY IF EXISTS messages_insert_participants ON public.messages;
CREATE POLICY messages_insert_participants ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    school_id = public.current_school_id()
    AND sender_id = auth.uid()
    AND (
      parent_id = public.get_parent_id(auth.uid())
      OR teacher_id = public.get_teacher_id(auth.uid())
      OR public.is_school_admin(auth.uid())
    )
  );
