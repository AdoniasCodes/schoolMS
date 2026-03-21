-- Add sender_id to messages to identify who sent each message in the thread.
-- Without this, there's no way to distinguish parent vs teacher messages.

ALTER TABLE public.messages
  ADD COLUMN sender_id UUID REFERENCES public.users(id);

-- Update existing messages: guess sender based on existing data (best-effort)
-- For new messages, sender_id will always be set by the app.

-- Update RLS insert policy to require sender_id = auth.uid()
DROP POLICY IF EXISTS messages_insert_participants ON public.messages;
CREATE POLICY messages_insert_participants ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    school_id = public.current_school_id()
    AND sender_id = auth.uid()
  );
