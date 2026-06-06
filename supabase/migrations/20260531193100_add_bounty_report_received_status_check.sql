-- Step 2: only for text-based status columns (skip when status uses bounty_status enum).

DO $$
DECLARE
  constraint_rec record;
  status_udt_name text;
BEGIN
  SELECT udt_name
  INTO status_udt_name
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'bounties'
    AND column_name = 'status';

  IF status_udt_name = 'bounty_status' THEN
    RETURN;
  END IF;

  FOR constraint_rec IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'bounties'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.bounties DROP CONSTRAINT %I', constraint_rec.conname);
  END LOOP;

  ALTER TABLE public.bounties
    DROP CONSTRAINT IF EXISTS bounties_status_check;

  ALTER TABLE public.bounties
    ADD CONSTRAINT bounties_status_check
    CHECK (status IN (
      'pending_review',
      'approved',
      'published',
      'report_received',
      'resolved',
      'rejected',
      'refunded'
    ));
END $$;
