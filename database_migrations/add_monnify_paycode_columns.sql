-- Monnify Paycode metadata for reward payouts
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS monnify_paycode_reference text;

ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS monnify_transaction_reference text;

ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS reward_paycode_expires_at timestamptz;

ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS reward_paycode_status text;

COMMENT ON COLUMN public.reports.monnify_paycode_reference IS 'Monnify paycodeReference for the issued reward paycode';
COMMENT ON COLUMN public.reports.monnify_transaction_reference IS 'Monnify transactionReference for the issued reward paycode';
COMMENT ON COLUMN public.reports.reward_paycode_expires_at IS 'When the Monnify reward paycode expires';
COMMENT ON COLUMN public.reports.reward_paycode_status IS 'Monnify paycode status (e.g. PENDING, SUCCESS, EXPIRED, CANCELLED)';
