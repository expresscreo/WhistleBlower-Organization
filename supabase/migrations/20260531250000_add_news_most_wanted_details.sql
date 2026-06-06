-- Structured Most Wanted profile data (person alerts)
ALTER TABLE public.news
  ADD COLUMN IF NOT EXISTS most_wanted_details JSONB NULL;

COMMENT ON COLUMN public.news.most_wanted_details IS
  'Structured fields for most_wanted category posts (case facts, narrative, physical description).';
