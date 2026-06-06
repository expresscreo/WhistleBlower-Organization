-- Mirror of supabase/migrations/20260606120000_add_bounty_chat_features.sql

ALTER TABLE public.bounty_updates
  ADD COLUMN IF NOT EXISTS reply_to_message_id uuid REFERENCES public.bounty_updates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_read_by_placer boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_read_by_admin boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.bounties
  ADD COLUMN IF NOT EXISTS placer_has_viewed boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS admin_has_viewed boolean DEFAULT true;

UPDATE public.bounty_updates
SET
  is_read_by_placer = CASE
    WHEN updated_by IS NOT NULL THEN COALESCE(is_read_by_placer, false)
    ELSE false
  END,
  is_read_by_admin = CASE
    WHEN updated_by IS NULL THEN COALESCE(is_read_by_admin, false)
    ELSE false
  END
WHERE is_read_by_placer IS NULL OR is_read_by_admin IS NULL;

CREATE INDEX IF NOT EXISTS idx_bounty_updates_reply_to
  ON public.bounty_updates(reply_to_message_id)
  WHERE reply_to_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bounty_updates_read_status
  ON public.bounty_updates(bounty_id, is_read_by_placer, is_read_by_admin);

CREATE OR REPLACE FUNCTION public.mark_bounty_messages_as_read(
  p_bounty_id uuid,
  p_reader_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_reader_id IS NULL THEN
    UPDATE public.bounty_updates
    SET is_read_by_placer = true
    WHERE bounty_id = p_bounty_id
      AND updated_by IS NOT NULL
      AND is_read_by_placer = false;
  ELSE
    UPDATE public.bounty_updates
    SET is_read_by_admin = true
    WHERE bounty_id = p_bounty_id
      AND updated_by IS NULL
      AND is_read_by_admin = false;
  END IF;
END;
$$;

ALTER TABLE public.bounty_updates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated manage bounty updates" ON public.bounty_updates;

CREATE POLICY "authenticated manage bounty updates"
  ON public.bounty_updates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT ALL ON public.bounty_updates TO authenticated;
GRANT ALL ON public.bounty_updates TO service_role;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.bounty_updates;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
