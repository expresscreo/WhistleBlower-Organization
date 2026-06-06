-- Run if hunter submissions still auto-set report_received.
-- report_received should only be set by admin after review.

DROP TRIGGER IF EXISTS bounty_reports_sync_bounty_status ON public.bounty_reports;
DROP FUNCTION IF EXISTS public.sync_bounty_status_on_hunter_report();

NOTIFY pgrst, 'reload schema';
