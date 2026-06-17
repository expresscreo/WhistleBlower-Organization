-- Migration to add advanced chat features to report_updates table
-- Based on CHAT_FEATURE_DOCUMENTATION.md requirements

-- Add the missing columns for advanced chat functionality
ALTER TABLE public.report_updates 
ADD COLUMN IF NOT EXISTS reply_to_message_id uuid REFERENCES public.report_updates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_read_by_reporter boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_read_by_admin boolean DEFAULT false;

-- Update existing records to have proper read status
-- Set is_read_by_reporter and is_read_by_admin based on existing is_read field
UPDATE public.report_updates 
SET 
  is_read_by_reporter = CASE 
    WHEN updated_by IS NOT NULL THEN is_read 
    ELSE false 
  END,
  is_read_by_admin = CASE 
    WHEN updated_by IS NULL THEN is_read 
    ELSE false 
  END
WHERE is_read_by_reporter IS NULL OR is_read_by_admin IS NULL;

-- Create index for better performance on reply lookups
CREATE INDEX IF NOT EXISTS idx_report_updates_reply_to 
ON public.report_updates(reply_to_message_id) 
WHERE reply_to_message_id IS NOT NULL;

-- Create index for read status queries
CREATE INDEX IF NOT EXISTS idx_report_updates_read_status 
ON public.report_updates(report_id, is_read_by_reporter, is_read_by_admin);

-- Ensure RLS is enabled and policies are correct
ALTER TABLE public.report_updates ENABLE ROW LEVEL SECURITY;

-- Update or create the comprehensive RLS policy
DROP POLICY IF EXISTS "Allow all operations on report_updates" ON public.report_updates;

CREATE POLICY "Allow all operations on report_updates" ON public.report_updates
  FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.report_updates TO anon;
GRANT ALL ON public.report_updates TO authenticated;
GRANT ALL ON public.report_updates TO service_role;

-- Enable real-time for the table (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_updates;

-- Create or replace function to mark messages as read with new schema
CREATE OR REPLACE FUNCTION mark_messages_as_read(message_ids bigint[], p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.report_updates 
  SET 
    is_read_by_admin = CASE 
      WHEN updated_by IS NULL THEN true 
      ELSE is_read_by_admin 
    END,
    is_read_by_reporter = CASE 
      WHEN updated_by IS NOT NULL THEN true 
      ELSE is_read_by_reporter 
    END
  WHERE id = ANY(message_ids);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for report-specific read marking (for anonymous users)
CREATE OR REPLACE FUNCTION mark_messages_as_read(p_report_id uuid, p_reader_id uuid)
RETURNS void AS $$
BEGIN
  IF p_reader_id IS NULL THEN
    -- Anonymous user (reporter) - mark admin messages as read by reporter
    UPDATE public.report_updates 
    SET is_read_by_reporter = true
    WHERE report_id = p_report_id 
    AND updated_by IS NOT NULL 
    AND is_read_by_reporter = false;
  ELSE
    -- Admin user - mark reporter messages as read by admin
    UPDATE public.report_updates 
    SET is_read_by_admin = true
    WHERE report_id = p_report_id 
    AND updated_by IS NULL 
    AND is_read_by_admin = false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get unread message counts
CREATE OR REPLACE FUNCTION get_unread_message_count(p_report_id uuid, p_user_id uuid)
RETURNS TABLE(unread_from_reporter integer, unread_from_admin integer) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::integer FROM public.report_updates 
     WHERE report_id = p_report_id 
     AND updated_by IS NULL 
     AND is_read_by_admin = false) as unread_from_reporter,
    (SELECT COUNT(*)::integer FROM public.report_updates 
     WHERE report_id = p_report_id 
     AND updated_by IS NOT NULL 
     AND is_read_by_reporter = false) as unread_from_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment to document the schema
COMMENT ON COLUMN public.report_updates.reply_to_message_id IS 'References another message for threading/reply functionality';
COMMENT ON COLUMN public.report_updates.is_read_by_reporter IS 'Whether this message has been read by the anonymous reporter';
COMMENT ON COLUMN public.report_updates.is_read_by_admin IS 'Whether this message has been read by admin users';
