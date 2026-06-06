-- Fix: invalid input value for enum bounty_status: "report_received"
--
-- Run each section separately in Supabase SQL Editor (one section = one Run click).

-- ========== A) VERIFY — run first ==========
SELECT e.enumlabel AS bounty_status_value, e.enumsortorder
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typname = 'bounty_status'
ORDER BY e.enumsortorder;

-- If report_received is missing from the list above, run section B alone.
-- If report_received IS listed but the app still fails, run section C alone.


-- ========== B) ADD ENUM VALUE — run alone (only if missing from section A) ==========
ALTER TYPE public.bounty_status ADD VALUE 'report_received';


-- ========== C) RELOAD SUPABASE API SCHEMA — run after B (or if A already shows report_received) ==========
NOTIFY pgrst, 'reload schema';

-- Also reload from the dashboard if needed:
-- Project Settings → API → "Reload schema" (or restart the project briefly)


-- ========== D) VERIFY AGAIN ==========
SELECT e.enumlabel AS bounty_status_value
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
JOIN pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
  AND t.typname = 'bounty_status'
ORDER BY e.enumsortorder;

-- ========== E) OPTIONAL SMOKE TEST (replace <bounty_uuid>) ==========
-- UPDATE public.bounties
-- SET status = 'report_received'
-- WHERE id = '<bounty_uuid>'
-- RETURNING id, status;
