-- Permanent delete on reports/bounties fails because legacy triggers call
-- storage.delete_object(s), which is unavailable after moving to local file storage.
-- Replace those triggers with SECURITY DEFINER RPCs that clean up dependencies safely.

DO $$
DECLARE
  trigger_row RECORD;
BEGIN
  FOR trigger_row IN
    SELECT t.tgname AS trigger_name, c.relname AS table_name
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_proc p ON p.oid = t.tgfoid
    WHERE n.nspname = 'public'
      AND c.relname IN ('reports', 'bounties')
      AND NOT t.tgisinternal
      AND (
        pg_get_functiondef(p.oid) ILIKE '%storage.delete_object%'
        OR pg_get_functiondef(p.oid) ILIKE '%storage.delete_objects%'
      )
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON public.%I',
      trigger_row.trigger_name,
      trigger_row.table_name
    );
    RAISE NOTICE 'Dropped storage cleanup trigger % on public.%',
      trigger_row.trigger_name,
      trigger_row.table_name;
  END LOOP;
END $$;

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

  DELETE FROM public.report_assignments WHERE report_id = p_report_id;
  DELETE FROM public.bounty_reports WHERE report_id = p_report_id;
  UPDATE public.wallet_transactions SET report_id = NULL WHERE report_id = p_report_id;
  DELETE FROM public.report_updates WHERE report_id = p_report_id;
  DELETE FROM public.reports WHERE id = p_report_id;
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

  UPDATE public.news SET bounty_id = NULL WHERE bounty_id = p_bounty_id;
  DELETE FROM public.bounty_reports WHERE bounty_id = p_bounty_id;
  DELETE FROM public.bounty_updates WHERE bounty_id = p_bounty_id;
  DELETE FROM public.bounties WHERE id = p_bounty_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_report_and_dependencies(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_bounty_and_dependencies(uuid) TO authenticated;
