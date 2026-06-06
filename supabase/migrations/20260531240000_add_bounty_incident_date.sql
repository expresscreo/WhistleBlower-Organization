ALTER TABLE public.bounties
  ADD COLUMN IF NOT EXISTS incident_date date;

COMMENT ON COLUMN public.bounties.incident_date IS 'Date the incident occurred';
