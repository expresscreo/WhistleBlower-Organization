-- Harden anonymous access to core whistleblower tracking tables.
-- Tracking now goes through Next.js server routes that verify passwords
-- with the service role and return sanitized rows.

-- reports: anonymous users submit through create_report_with_evidence and
-- track through /api/track/report, so direct anonymous table access is blocked.
drop policy if exists "anon compatibility can insert reports" on public.reports;
drop policy if exists "anon compatibility can track reports" on public.reports;
drop policy if exists "anon compatibility can update tracked reports" on public.reports;

-- report_updates: reporter chat/update access now goes through server routes.
drop policy if exists "anon compatibility can read report updates" on public.report_updates;
drop policy if exists "anon compatibility can insert reporter updates" on public.report_updates;
drop policy if exists "anon compatibility can update report read receipts" on public.report_updates;

-- bounties: public pages may read only visible bounty statuses. Creation and
-- tracking happen through server routes, so direct anonymous insert/update is blocked.
drop policy if exists "public can read visible bounties" on public.bounties;
drop policy if exists "anon compatibility can insert bounties" on public.bounties;
drop policy if exists "anon compatibility can update tracked bounties" on public.bounties;

create policy "public can read visible bounties"
on public.bounties
for select
to anon, authenticated
using (status in ('published', 'report_received', 'resolved'));

-- bounty_reports: public bounty tip submission still needs to link the newly
-- created report to the public bounty. Restrict linking to visible bounties.
drop policy if exists "anon compatibility can link bounty reports" on public.bounty_reports;

create policy "anon can link reports to visible bounties"
on public.bounty_reports
for insert
to anon
with check (
  exists (
    select 1
    from public.bounties b
    where b.id = bounty_reports.bounty_id
      and b.status in ('published', 'report_received', 'resolved')
  )
);

notify pgrst, 'reload schema';
