-- Link Most Wanted sighting tips to published alerts (mirrors bounty_reports).

CREATE TABLE IF NOT EXISTS public.most_wanted_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  report_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (news_id, report_id)
);

CREATE INDEX IF NOT EXISTS most_wanted_reports_news_id_idx
  ON public.most_wanted_reports (news_id);

CREATE INDEX IF NOT EXISTS most_wanted_reports_report_id_idx
  ON public.most_wanted_reports (report_id);

ALTER TABLE public.most_wanted_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated can read most wanted reports" ON public.most_wanted_reports;
CREATE POLICY "authenticated can read most wanted reports"
ON public.most_wanted_reports
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "anon can link reports to published most wanted alerts" ON public.most_wanted_reports;
CREATE POLICY "anon can link reports to published most wanted alerts"
ON public.most_wanted_reports
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.news n
    WHERE n.id = most_wanted_reports.news_id
      AND n.category = 'most_wanted'
      AND n.status = 'published'
  )
);

DROP POLICY IF EXISTS "authenticated can link most wanted reports" ON public.most_wanted_reports;
CREATE POLICY "authenticated can link most wanted reports"
ON public.most_wanted_reports
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Extend cascade delete helpers used by purge_expired_trash and permanent delete RPCs.
CREATE OR REPLACE FUNCTION public._cascade_delete_report(p_report_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_public_report_id text;
BEGIN
  SELECT report_id
  INTO v_public_report_id
  FROM public.reports
  WHERE id = p_report_id;

  DELETE FROM public.report_assignments WHERE report_id = p_report_id;
  DELETE FROM public.bounty_reports
  WHERE report_id = p_report_id::text
     OR (v_public_report_id IS NOT NULL AND report_id = v_public_report_id);
  DELETE FROM public.most_wanted_reports
  WHERE report_id = p_report_id::text
     OR (v_public_report_id IS NOT NULL AND report_id = v_public_report_id);
  UPDATE public.wallet_transactions SET report_id = NULL WHERE report_id = p_report_id;
  DELETE FROM public.report_updates WHERE report_id = p_report_id;
  DELETE FROM public.reports WHERE id = p_report_id;
END;
$$;

-- Backfill links for legacy tips that only stored Alert ID in the description body.
INSERT INTO public.most_wanted_reports (news_id, report_id)
SELECT DISTINCT n.id, r.id::text
FROM public.reports r
JOIN public.news n
  ON n.category = 'most_wanted'
 AND n.id::text = (regexp_match(r.description, 'Alert ID:\s*([0-9a-f-]{36})', 'i'))[1]
WHERE r.category = 'Most Wanted'
  AND r.is_trashed = false
ON CONFLICT (news_id, report_id) DO NOTHING;

INSERT INTO public.most_wanted_reports (news_id, report_id)
SELECT DISTINCT n.id, r.report_id
FROM public.reports r
JOIN public.news n
  ON n.category = 'most_wanted'
 AND n.id::text = (regexp_match(r.description, 'Alert ID:\s*([0-9a-f-]{36})', 'i'))[1]
WHERE r.category = 'Most Wanted'
  AND r.is_trashed = false
  AND r.report_id IS NOT NULL
ON CONFLICT (news_id, report_id) DO NOTHING;

NOTIFY pgrst, 'reload schema';
