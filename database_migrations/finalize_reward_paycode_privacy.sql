-- Run immediately after deploying the reward-paycode-secrets application code.
-- Existing secrets were backfilled by add_reward_fees_and_paycode_privacy.sql.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.reports r
    WHERE r.reward_paycode IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.reward_paycode_secrets s
        WHERE s.report_id = r.id
          AND s.paycode = r.reward_paycode
      )
  ) THEN
    RAISE EXCEPTION 'paycode_secret_backfill_incomplete';
  END IF;
END;
$$;

UPDATE public.reports
SET
  reward_paycode = NULL,
  monnify_paycode_reference = NULL,
  monnify_transaction_reference = NULL
WHERE reward_paycode IS NOT NULL
   OR monnify_paycode_reference IS NOT NULL
   OR monnify_transaction_reference IS NOT NULL;
