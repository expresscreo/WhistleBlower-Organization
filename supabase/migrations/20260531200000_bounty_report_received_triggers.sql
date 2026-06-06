-- report_received is admin-confirmed: only allowed when hunter reports exist.
-- Does NOT auto-set on hunter submission.

CREATE OR REPLACE FUNCTION public.enforce_bounty_report_received_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'report_received'
     AND (OLD.status IS DISTINCT FROM 'report_received') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM public.bounty_reports br
      WHERE br.bounty_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'bounty_status_report_received_requires_hunter_reports'
        USING HINT = 'Select Report Received only after a hunter has submitted and you have reviewed the report.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bounties_enforce_report_received_status ON public.bounties;

CREATE TRIGGER bounties_enforce_report_received_status
  BEFORE UPDATE OF status ON public.bounties
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_bounty_report_received_status();

NOTIFY pgrst, 'reload schema';
