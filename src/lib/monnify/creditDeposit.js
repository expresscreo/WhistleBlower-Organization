import { getServiceSupabase } from '@/lib/serverSupabase';
import {
  getTransactionStatus,
  parseDepositOrganizationId,
} from '@/lib/monnify/collections';

/**
 * Credit an organization wallet for a confirmed Monnify deposit.
 * Idempotent on paymentReference so webhook retries are safe.
 */
export async function creditOrganizationDeposit({
  paymentReference,
  transactionReference,
  metadata,
}) {
  if (!paymentReference) {
    console.error('Monnify deposit: missing paymentReference');
    return { ok: false, reason: 'missing_reference' };
  }

  const supabase = getServiceSupabase();

  const { data: intent, error: intentError } = await supabase
    .from('wallet_deposit_intents')
    .select(
      'id, organization_id, payment_reference, gross_amount, wallet_credit_amount, status',
    )
    .eq('payment_reference', paymentReference)
    .maybeSingle();

  if (intentError || !intent) {
    console.error('Monnify deposit: intent lookup failed', intentError?.message);
    return { ok: false, reason: 'intent_not_found' };
  }
  if (intent.status === 'completed') {
    return { ok: true, skipped: true, reason: 'already_credited' };
  }
  if (intent.status !== 'pending') {
    return { ok: false, skipped: true, reason: 'intent_not_pending' };
  }

  let verified;
  try {
    verified = await getTransactionStatus(transactionReference || paymentReference);
  } catch (error) {
    console.error('Monnify deposit: status query failed', error?.message || error);
    return { ok: false, reason: 'status_query_failed' };
  }

  if (!verified.isPaid) {
    return { ok: false, skipped: true, reason: 'not_paid' };
  }

  if (
    verified.paymentReference &&
    verified.paymentReference !== intent.payment_reference
  ) {
    console.error('Monnify deposit: payment reference mismatch');
    return { ok: false, reason: 'reference_mismatch' };
  }

  const organizationId = parseDepositOrganizationId(
    verified.paymentReference || paymentReference,
    verified.metadata || metadata,
  );
  if (!organizationId) {
    console.error('Monnify deposit: could not resolve organization', { paymentReference });
    return { ok: false, reason: 'missing_organization' };
  }
  if (organizationId !== intent.organization_id) {
    console.error('Monnify deposit: organization mismatch');
    return { ok: false, reason: 'organization_mismatch' };
  }

  const grossPaid = Number(verified.amountPaid);
  if (
    !Number.isFinite(grossPaid) ||
    Math.abs(grossPaid - Number(intent.gross_amount)) > 0.01
  ) {
    console.error('Monnify deposit: gross amount mismatch', {
      paymentReference,
      expected: intent.gross_amount,
      received: grossPaid,
    });
    return { ok: false, reason: 'amount_mismatch' };
  }

  const { data: completed, error: completionError } = await supabase.rpc(
    'complete_wallet_deposit',
    {
      p_payment_reference: paymentReference,
      p_monnify_transaction_reference:
        verified.transactionReference || transactionReference,
      p_gross_paid: grossPaid,
    },
  );

  if (completionError) {
    console.error('Monnify deposit: atomic completion failed', completionError.message);
    return { ok: false, reason: 'completion_failed' };
  }

  return {
    ok: true,
    skipped: Boolean(completed?.alreadyCompleted),
    organizationId,
    amount: Number(intent.wallet_credit_amount),
  };
}
