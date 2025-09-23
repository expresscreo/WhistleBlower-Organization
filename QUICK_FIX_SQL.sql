-- QUICK FIX: Add missing columns to report_updates table
-- Copy and paste this into your Supabase SQL Editor

-- Step 1: Add the missing columns
ALTER TABLE public.report_updates 
ADD COLUMN IF NOT EXISTS reply_to_message_id bigint REFERENCES public.report_updates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_read_by_reporter boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_read_by_admin boolean DEFAULT false;

-- Step 2: Update existing records to have proper read status
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

-- Step 3: Create function for read status management
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

-- Step 4: Enable real-time (if not already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.report_updates;
