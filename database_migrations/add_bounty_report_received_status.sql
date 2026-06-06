-- Adds report_received to bounty statuses (bounty_status enum).
--
-- IMPORTANT: Run each numbered step in a SEPARATE Supabase SQL Editor query.
-- If the app still rejects report_received after step 1, run step 2 (schema reload).

-- Step 1 — add enum value (run alone)
ALTER TYPE public.bounty_status ADD VALUE IF NOT EXISTS 'report_received';

-- Step 2 — reload Supabase API schema cache (run alone, after step 1)
NOTIFY pgrst, 'reload schema';

-- Step 3 — verify (optional)
-- SELECT enumlabel FROM pg_enum e
-- JOIN pg_type t ON e.enumtypid = t.oid
-- WHERE t.typname = 'bounty_status'
-- ORDER BY e.enumsortorder;

-- Troubleshooting: see database_migrations/fix_bounty_report_received_status.sql
