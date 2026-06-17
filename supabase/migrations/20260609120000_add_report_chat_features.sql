-- Report reporter <-> admin secure chat (mirrors bounty_updates chat fields)
-- Adds threading and separate read receipts for report_updates.

ALTER TABLE public.report_updates
  ADD COLUMN IF NOT EXISTS reply_to_message_id uuid REFERENCES public.report_updates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_read_by_reporter boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_read_by_admin boolean DEFAULT false;

UPDATE public.report_updates
SET
  is_read_by_reporter = CASE
    WHEN updated_by IS NOT NULL THEN COALESCE(is_read, false)
    ELSE false
  END,
  is_read_by_admin = CASE
    WHEN updated_by IS NULL THEN COALESCE(is_read, false)
    ELSE false
  END
WHERE is_read_by_reporter IS NULL OR is_read_by_admin IS NULL;

CREATE INDEX IF NOT EXISTS idx_report_updates_reply_to
  ON public.report_updates(reply_to_message_id)
  WHERE reply_to_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_report_updates_read_status
  ON public.report_updates(report_id, is_read_by_reporter, is_read_by_admin);

CREATE OR REPLACE FUNCTION mark_messages_as_read(p_report_id uuid, p_reader_id uuid)
RETURNS void AS $$
BEGIN
  IF p_reader_id IS NULL THEN
    UPDATE public.report_updates
    SET is_read_by_reporter = true
    WHERE report_id = p_report_id
      AND updated_by IS NOT NULL
      AND is_read_by_reporter = false;
  ELSE
    UPDATE public.report_updates
    SET is_read_by_admin = true
    WHERE report_id = p_report_id
      AND updated_by IS NULL
      AND is_read_by_admin = false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.report_updates;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
