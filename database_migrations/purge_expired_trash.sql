-- Auto-purge trashed reports and bounties after 30 days.

CREATE OR REPLACE FUNCTION public._cascade_delete_report(p_report_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.report_assignments WHERE report_id = p_report_id;
  DELETE FROM public.bounty_reports WHERE report_id = p_report_id;
  UPDATE public.wallet_transactions SET report_id = NULL WHERE report_id = p_report_id;
  DELETE FROM public.report_updates WHERE report_id = p_report_id;
  DELETE FROM public.reports WHERE id = p_report_id;
END;
$$;

CREATE OR REPLACE FUNCTION public._cascade_delete_bounty(p_bounty_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.news SET bounty_id = NULL WHERE bounty_id = p_bounty_id;
  DELETE FROM public.bounty_reports WHERE bounty_id = p_bounty_id;
  DELETE FROM public.bounty_updates WHERE bounty_id = p_bounty_id;
  DELETE FROM public.bounties WHERE id = p_bounty_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_report_and_dependencies(p_report_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_trashed boolean;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.user_type = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'insufficient_privileges'
      USING ERRCODE = '42501';
  END IF;

  SELECT is_trashed
  INTO v_is_trashed
  FROM public.reports
  WHERE id = p_report_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'report_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  IF NOT COALESCE(v_is_trashed, false) THEN
    RAISE EXCEPTION 'report_must_be_trashed'
      USING ERRCODE = 'P0001';
  END IF;

  PERFORM public._cascade_delete_report(p_report_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_bounty_and_dependencies(p_bounty_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_trashed boolean;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = auth.uid()
      AND u.user_type = 'super_admin'
  ) THEN
    RAISE EXCEPTION 'insufficient_privileges'
      USING ERRCODE = '42501';
  END IF;

  SELECT is_trashed
  INTO v_is_trashed
  FROM public.bounties
  WHERE id = p_bounty_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'bounty_not_found'
      USING ERRCODE = 'P0002';
  END IF;

  IF NOT COALESCE(v_is_trashed, false) THEN
    RAISE EXCEPTION 'bounty_must_be_trashed'
      USING ERRCODE = 'P0001';
  END IF;

  PERFORM public._cascade_delete_bounty(p_bounty_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.purge_expired_trash()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cutoff timestamptz := now() - interval '30 days';
  report_row RECORD;
  bounty_row RECORD;
  v_reports integer := 0;
  v_bounties integer := 0;
BEGIN
  FOR report_row IN
    SELECT id
    FROM public.reports
    WHERE is_trashed = true
      AND trashed_at IS NOT NULL
      AND trashed_at < v_cutoff
  LOOP
    PERFORM public._cascade_delete_report(report_row.id);
    v_reports := v_reports + 1;
  END LOOP;

  FOR bounty_row IN
    SELECT id
    FROM public.bounties
    WHERE is_trashed = true
      AND trashed_at IS NOT NULL
      AND trashed_at < v_cutoff
  LOOP
    PERFORM public._cascade_delete_bounty(bounty_row.id);
    v_bounties := v_bounties + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'purged_reports', v_reports,
    'purged_bounties', v_bounties
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_report_and_dependencies(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_bounty_and_dependencies(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_trash() TO authenticated;

DO $outer$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-expired-trash-daily') THEN
    PERFORM cron.unschedule('purge-expired-trash-daily');
  END IF;

  PERFORM cron.schedule(
    'purge-expired-trash-daily',
    '0 3 * * *',
    $$SELECT public.purge_expired_trash()$$
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'pg_cron schedule skipped: %', SQLERRM;
END;
$outer$;
