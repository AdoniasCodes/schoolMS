-- Migration 0011: Add message_id FK to media_assets for message attachments
-- Also expand allowed mime types to include PDFs

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES public.messages(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_media_assets_message_id ON public.media_assets(message_id);

-- Allow PDF uploads alongside images and videos
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/*', 'video/*', 'application/pdf']
WHERE id = 'media';
