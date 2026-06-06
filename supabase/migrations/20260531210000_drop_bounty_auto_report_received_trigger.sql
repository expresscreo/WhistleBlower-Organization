-- Remove auto-sync trigger if it was applied by an earlier migration.
-- report_received is now admin-selected after reviewing hunter submissions.

DROP TRIGGER IF EXISTS bounty_reports_sync_bounty_status ON public.bounty_reports;
DROP FUNCTION IF EXISTS public.sync_bounty_status_on_hunter_report();

NOTIFY pgrst, 'reload schema';
