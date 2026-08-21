-- Reward accounting:
-- 1. Organizations pay Monnify collection fees on top of wallet deposits.
-- 2. Paycode issuance debits reward principal plus an uncapped 10% service fee.
-- 3. Cleartext paycodes are stored outside organization-readable report rows.

CREATE TABLE IF NOT EXISTS public.wallet_deposit_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL REFERENCES public.organization_wallets(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  payment_reference text NOT NULL UNIQUE,
  monnify_transaction_reference text,
  wallet_credit_amount numeric(18, 2) NOT NULL CHECK (wallet_credit_amount > 0),
  processing_fee_amount numeric(18, 2) NOT NULL CHECK (processing_fee_amount >= 0),
  gross_amount numeric(18, 2) NOT NULL CHECK (gross_amount > 0),
  fee_rate numeric(10, 6) NOT NULL,
  fee_vat_rate numeric(10, 6) NOT NULL,
  fee_cap_amount numeric(18, 2) NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (gross_amount = wallet_credit_amount + processing_fee_amount)
);

CREATE INDEX IF NOT EXISTS wallet_deposit_intents_org_created_idx
  ON public.wallet_deposit_intents (organization_id, created_at DESC);

ALTER TABLE public.wallet_deposit_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.wallet_deposit_intents FROM anon, authenticated;
GRANT ALL ON public.wallet_deposit_intents TO service_role;

ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS transaction_subtype text;

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS reward_service_fee_rate numeric(10, 6),
  ADD COLUMN IF NOT EXISTS reward_service_fee_amount numeric(18, 2),
  ADD COLUMN IF NOT EXISTS reward_total_debit numeric(18, 2);

CREATE TABLE IF NOT EXISTS public.reward_paycode_secrets (
  report_id uuid PRIMARY KEY REFERENCES public.reports(id) ON DELETE CASCADE,
  paycode text NOT NULL,
  monnify_paycode_reference text UNIQUE,
  monnify_transaction_reference text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reward_paycode_secrets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.reward_paycode_secrets FROM anon, authenticated;
GRANT ALL ON public.reward_paycode_secrets TO service_role;

-- Preserve existing issued paycodes. Legacy report columns are cleared by the
-- deployment-time cleanup migration after the new track API is live, avoiding
-- an interruption for reporters during a rolling deployment.
INSERT INTO public.reward_paycode_secrets (
  report_id,
  paycode,
  monnify_paycode_reference,
  monnify_transaction_reference
)
SELECT
  id,
  reward_paycode,
  monnify_paycode_reference,
  monnify_transaction_reference
FROM public.reports
WHERE reward_paycode IS NOT NULL
ON CONFLICT (report_id) DO UPDATE SET
  paycode = EXCLUDED.paycode,
  monnify_paycode_reference = EXCLUDED.monnify_paycode_reference,
  monnify_transaction_reference = EXCLUDED.monnify_transaction_reference,
  updated_at = now();

CREATE OR REPLACE FUNCTION public.complete_wallet_deposit(
  p_payment_reference text,
  p_monnify_transaction_reference text,
  p_gross_paid numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  intent public.wallet_deposit_intents%ROWTYPE;
  wallet public.organization_wallets%ROWTYPE;
BEGIN
  SELECT * INTO intent
  FROM public.wallet_deposit_intents
  WHERE payment_reference = p_payment_reference
  FOR UPDATE;

  IF intent.id IS NULL THEN
    RAISE EXCEPTION 'deposit_intent_not_found';
  END IF;

  IF intent.status = 'completed' THEN
    RETURN jsonb_build_object(
      'completed', true,
      'alreadyCompleted', true,
      'walletCredit', intent.wallet_credit_amount
    );
  END IF;

  IF intent.status <> 'pending' THEN
    RAISE EXCEPTION 'deposit_intent_not_pending';
  END IF;

  IF abs(p_gross_paid - intent.gross_amount) > 0.01 THEN
    RAISE EXCEPTION 'deposit_amount_mismatch';
  END IF;

  SELECT * INTO wallet
  FROM public.organization_wallets
  WHERE id = intent.wallet_id
  FOR UPDATE;

  IF wallet.id IS NULL OR wallet.organization_id <> intent.organization_id THEN
    RAISE EXCEPTION 'deposit_wallet_mismatch';
  END IF;

  UPDATE public.organization_wallets
  SET balance = balance + intent.wallet_credit_amount
  WHERE id = wallet.id;

  INSERT INTO public.wallet_transactions (
    wallet_id,
    amount,
    transaction_type,
    transaction_subtype,
    status,
    reference_id
  )
  VALUES (
    wallet.id,
    intent.wallet_credit_amount,
    'credit',
    'deposit',
    'completed',
    intent.payment_reference
  );

  UPDATE public.wallet_deposit_intents
  SET
    status = 'completed',
    monnify_transaction_reference = p_monnify_transaction_reference,
    completed_at = now(),
    updated_at = now()
  WHERE id = intent.id;

  RETURN jsonb_build_object(
    'completed', true,
    'alreadyCompleted', false,
    'organizationId', intent.organization_id,
    'walletCredit', intent.wallet_credit_amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_wallet_deposit(text, text, numeric)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_wallet_deposit(text, text, numeric)
  TO service_role;

CREATE OR REPLACE FUNCTION public.finalize_reward_paycode_issue(
  p_report_id uuid,
  p_reward_amount numeric,
  p_service_fee numeric,
  p_total_debit numeric,
  p_service_fee_rate numeric,
  p_paycode text,
  p_paycode_reference text,
  p_transaction_reference text,
  p_expires_at timestamptz,
  p_paycode_status text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reward_report public.reports%ROWTYPE;
  wallet public.organization_wallets%ROWTYPE;
BEGIN
  SELECT * INTO reward_report
  FROM public.reports
  WHERE id = p_report_id
  FOR UPDATE;

  IF reward_report.id IS NULL THEN
    RAISE EXCEPTION 'report_not_found';
  END IF;
  IF reward_report.status <> 'Resolved' OR reward_report.is_anonymous IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'report_not_reward_eligible';
  END IF;
  IF reward_report.reward_status NOT IN ('pending_request', 'rejected')
     AND reward_report.reward_status IS NOT NULL THEN
    RAISE EXCEPTION 'reward_not_issuable';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.reward_paycode_secrets WHERE report_id = reward_report.id
  ) THEN
    RAISE EXCEPTION 'paycode_already_issued';
  END IF;
  IF round(p_service_fee, 2) <> round(p_reward_amount * 0.10, 2)
     OR round(p_total_debit, 2) <> round(p_reward_amount + p_service_fee, 2) THEN
    RAISE EXCEPTION 'reward_fee_mismatch';
  END IF;

  SELECT * INTO wallet
  FROM public.organization_wallets
  WHERE organization_id = reward_report.organization_id
  FOR UPDATE;

  IF wallet.id IS NULL THEN
    RAISE EXCEPTION 'wallet_not_found';
  END IF;
  IF wallet.balance < p_total_debit THEN
    RAISE EXCEPTION 'insufficient_wallet_funds';
  END IF;

  UPDATE public.organization_wallets
  SET balance = balance - p_total_debit
  WHERE id = wallet.id;

  INSERT INTO public.wallet_transactions (
    wallet_id,
    report_id,
    amount,
    transaction_type,
    transaction_subtype,
    status,
    reference_id
  )
  VALUES
    (
      wallet.id,
      reward_report.id,
      p_reward_amount,
      'debit',
      'reward',
      'completed',
      'REWARD-' || reward_report.report_id
    ),
    (
      wallet.id,
      reward_report.id,
      p_service_fee,
      'debit',
      'platform_fee',
      'completed',
      'SERVICE-FEE-' || reward_report.report_id
    );

  INSERT INTO public.reward_paycode_secrets (
    report_id,
    paycode,
    monnify_paycode_reference,
    monnify_transaction_reference
  )
  VALUES (
    reward_report.id,
    p_paycode,
    p_paycode_reference,
    p_transaction_reference
  );

  UPDATE public.reports
  SET
    reward_requested_amount = p_reward_amount,
    reward_service_fee_rate = p_service_fee_rate,
    reward_service_fee_amount = p_service_fee,
    reward_total_debit = p_total_debit,
    reward_status = 'paid',
    reward_paycode_expires_at = p_expires_at,
    reward_paycode_status = p_paycode_status,
    reward_paycode = NULL,
    monnify_paycode_reference = NULL,
    monnify_transaction_reference = NULL
  WHERE id = reward_report.id;

  RETURN jsonb_build_object(
    'completed', true,
    'walletId', wallet.id,
    'newBalance', wallet.balance - p_total_debit
  );
END;
$$;

REVOKE ALL ON FUNCTION public.finalize_reward_paycode_issue(
  uuid, numeric, numeric, numeric, numeric, text, text, text, timestamptz, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_reward_paycode_issue(
  uuid, numeric, numeric, numeric, numeric, text, text, text, timestamptz, text
) TO service_role;
