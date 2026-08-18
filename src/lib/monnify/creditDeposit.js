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
  amountHint,
}) {
  if (!paymentReference) {
    console.error('Monnify deposit: missing paymentReference');
    return { ok: false, reason: 'missing_reference' };
  }

  const supabase = getServiceSupabase();

  const { data: existing } = await supabase
    .from('wallet_transactions')
    .select('id')
    .eq('reference_id', paymentReference)
    .maybeSingle();

  if (existing) {
    return { ok: true, skipped: true, reason: 'already_credited' };
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

  const amount = Number(verified.amountPaid || amountHint);
  if (!Number.isFinite(amount) || amount <= 0) {
    console.error('Monnify deposit: invalid amount', { paymentReference, amount });
    return { ok: false, reason: 'invalid_amount' };
  }

  const organizationId = parseDepositOrganizationId(
    verified.paymentReference || paymentReference,
    verified.metadata || metadata,
  );
  if (!organizationId) {
    console.error('Monnify deposit: could not resolve organization', { paymentReference });
    return { ok: false, reason: 'missing_organization' };
  }

  const { data: walletId, error: walletEnsureError } = await supabase.rpc(
    'get_or_create_wallet',
    { org_id: organizationId },
  );
  if (walletEnsureError || !walletId) {
    console.error('Monnify deposit: wallet ensure failed', walletEnsureError?.message);
    return { ok: false, reason: 'wallet_missing' };
  }

  async function creditWithLock() {
    const { data: wallet, error: walletError } = await supabase
      .from('organization_wallets')
      .select('id, balance')
      .eq('id', walletId)
      .maybeSingle();

    if (walletError || !wallet) {
      return { wallet: null, credited: null, error: walletError };
    }

    const newBalance = Number(wallet.balance) + amount;
    const { data: credited, error: creditError } = await supabase
      .from('organization_wallets')
      .update({ balance: newBalance })
      .eq('id', wallet.id)
      .eq('balance', wallet.balance)
      .select('id')
      .maybeSingle();

    return { wallet, credited, error: creditError };
  }

  let { wallet, credited, error: creditError } = await creditWithLock();
  if (!credited && !creditError) {
    ({ wallet, credited, error: creditError } = await creditWithLock());
  }

  if (creditError || !credited || !wallet) {
    console.error(
      'Monnify deposit: wallet credit failed',
      creditError?.message || 'balance changed',
    );
    return { ok: false, reason: 'credit_failed' };
  }

  const { error: txError } = await supabase.from('wallet_transactions').insert({
    wallet_id: wallet.id,
    amount,
    transaction_type: 'credit',
    status: 'completed',
    reference_id: paymentReference,
  });

  if (txError) {
    async function reverseCredit() {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        const { data: current } = await supabase
          .from('organization_wallets')
          .select('id, balance')
          .eq('id', wallet.id)
          .maybeSingle();
        if (!current) return;
        const { data: reversed } = await supabase
          .from('organization_wallets')
          .update({ balance: Number(current.balance) - amount })
          .eq('id', wallet.id)
          .eq('balance', current.balance)
          .select('id')
          .maybeSingle();
        if (reversed) return;
      }
    }

    await reverseCredit();
    if (txError.code === '23505') {
      return { ok: true, skipped: true, reason: 'already_credited' };
    }
    console.error('Monnify deposit: transaction insert failed', txError.message);
    return { ok: false, reason: 'tx_insert_failed' };
  }

  return { ok: true, organizationId, amount };
}
