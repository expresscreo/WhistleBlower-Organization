-- Extend bounty_status enum for hunter submissions on published bounties.

ALTER TYPE public.bounty_status ADD VALUE IF NOT EXISTS 'report_received';

-- Supabase PostgREST caches enum definitions; reload after adding a value.
NOTIFY pgrst, 'reload schema';
