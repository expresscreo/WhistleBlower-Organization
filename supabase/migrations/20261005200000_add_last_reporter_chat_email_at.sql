-- Track when admins were last emailed about a reporter chat message,
-- so we only send one notification per report every 24 hours.
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS last_reporter_chat_email_at timestamptz;
