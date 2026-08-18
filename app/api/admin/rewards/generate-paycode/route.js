import { randomUUID } from 'crypto';
import { jsonError, readJson } from '@/lib/httpJson';
import { requireAuthenticatedAdmin } from '@/lib/email/auth';
import { notifyRewardPaycodeGenerated } from '@/lib/email/notifications';
import {
  cancelPaycode,
  createPaycode,
  defaultPaycodeExpiryDate,
  DEFAULT_BENEFICIARY_NAME,
} from '@/lib/monnify/paycode';

export const runtime = 'nodejs';

function parseMonnifyExpiry(expiryDate) {
  // Monnify may omit expiryDate when it fell back to its own default (24h).
  if (!expiryDate) {
    const fallback = new Date();
    fallback.setHours(fallback.getHours() + 24);
    return fallback.toISOString();
  }
  if (expiryDate instanceof Date) return expiryDate.toISOString();

  // Monnify format: "yyyy-MM-dd HH:mm:ss"
  const normalized = String(expiryDate).trim().replace(' ', 'T');
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) {
    return defaultPaycodeExpiryDate().toISOString();
  }
  return parsed.toISOString();
}

export async function POST(request) {
  const auth = await requireAuthenticatedAdmin(request);
  if (auth.error) return auth.error;

  if (auth.profile.user_type !== 'super_admin') {
    return jsonError('Only platform super admins can generate reward paycodes.', 403);
  }

  const body = await readJson(request);
  const reportUuid = typeof body?.reportId === 'string' ? body.reportId.trim() : '';
  if (!reportUuid) {
    return jsonError('reportId is required.');
  }

  const { service } = auth;

  const { data: report, error: reportError } = await service
    .from('reports')
    .select(
      'id, report_id, organization_id, status, is_anonymous, reward_status, reward_requested_amount, reward_paycode',
    )
    .eq('id', reportUuid)
    .maybeSingle();

  if (reportError) {
    console.error('Reward generate-paycode: failed to load report', reportError.message);
    return jsonError('Could not load report.', 500);
  }
  if (!report) {
    return jsonError('Report not found.', 404);
  }

  if (report.status !== 'Resolved') {
    return jsonError('Report must be Resolved before generating a paycode.');
  }
  if (report.is_anonymous !== false) {
    return jsonError('This reporter did not opt in for a reward.');
  }
  if (report.reward_paycode) {
    return jsonError('A paycode has already been issued for this report.');
  }

  const allowedStatuses = new Set([null, 'pending_request', 'rejected']);
  if (!allowedStatuses.has(report.reward_status)) {
    return jsonError('Report is not eligible for paycode generation.');
  }

  const bodyAmount =
    body?.amount !== undefined && body?.amount !== null && body?.amount !== ''
      ? Number(body.amount)
      : null;

  let amount = Number(report.reward_requested_amount);
  if (report.reward_status === 'pending_request') {
    if (!Number.isFinite(amount) || amount <= 0) {
      return jsonError('Invalid reward amount on this request.');
    }
  } else {
    amount = bodyAmount;
    if (!Number.isFinite(amount) || amount <= 0) {
      return jsonError('Please provide a valid reward amount.');
    }

    const { error: amountError } = await service
      .from('reports')
      .update({
        reward_requested_amount: amount,
        reward_status: 'pending_request',
      })
      .eq('id', report.id)
      .is('reward_paycode', null);

    if (amountError) {
      console.error('Reward generate-paycode: failed to set amount', amountError.message);
      return jsonError('Could not save reward amount.', 500);
    }
  }

  if (!report.organization_id) {
    return jsonError('Report is not linked to an organization.');
  }

  const { data: wallet, error: walletError } = await service
    .from('organization_wallets')
    .select('id, balance')
    .eq('organization_id', report.organization_id)
    .maybeSingle();

  if (walletError) {
    console.error('Reward generate-paycode: wallet lookup failed', walletError.message);
    return jsonError('Could not load organization wallet.', 500);
  }
  if (!wallet) {
    return jsonError('Organization wallet not found.');
  }
  if (Number(wallet.balance) < amount) {
    return jsonError('Organization has insufficient wallet funds.');
  }

  const paycodeReference = `REWARD-${report.report_id}-${randomUUID()}`;
  const expiryDate = defaultPaycodeExpiryDate();

  let monnifyResult;
  try {
    monnifyResult = await createPaycode({
      amount,
      paycodeReference,
      beneficiaryName: DEFAULT_BENEFICIARY_NAME,
      expiryDate,
    });
  } catch (error) {
    console.error('Reward generate-paycode: Monnify create failed', error?.message || error);
    const isGenericFailure = /unable to process request/i.test(error?.message || '');
    const hint = isGenericFailure
      ? ' This usually means the Paycode/offline-payout feature is not yet activated on this Monnify merchant account — contact integration-support@monnify.com to enable it.'
      : '';
    return jsonError(
      `${error?.message || 'Failed to create Monnify paycode.'}${hint}`,
      502,
    );
  }

  const expiresAt = parseMonnifyExpiry(monnifyResult.expiryDate);
  const newBalance = Number(wallet.balance) - amount;
  const transactionReference = `REWARD-${report.report_id}`;

  async function rollbackMonnify(reason) {
    try {
      await cancelPaycode(monnifyResult.paycodeReference);
    } catch (cancelError) {
      console.error(
        `Reward generate-paycode: Monnify cancel after ${reason}`,
        cancelError?.message || cancelError,
      );
    }
  }

  async function restoreWallet() {
    await service
      .from('organization_wallets')
      .update({ balance: Number(wallet.balance) })
      .eq('id', wallet.id);
  }

  async function removeWalletTransaction() {
    await service
      .from('wallet_transactions')
      .delete()
      .eq('wallet_id', wallet.id)
      .eq('reference_id', transactionReference)
      .eq('report_id', report.id);
  }

  // Optimistic lock: only debit if balance is still the value we read
  const { data: debitedWallet, error: walletUpdateError } = await service
    .from('organization_wallets')
    .update({ balance: newBalance })
    .eq('id', wallet.id)
    .eq('balance', wallet.balance)
    .select('id, balance')
    .maybeSingle();

  if (walletUpdateError || !debitedWallet) {
    console.error(
      'Reward generate-paycode: wallet debit failed',
      walletUpdateError?.message || 'balance changed',
    );
    await rollbackMonnify('wallet failure');
    return jsonError(
      walletUpdateError
        ? 'Failed to debit organization wallet. Paycode was cancelled.'
        : 'Organization wallet balance changed. Please retry.',
      walletUpdateError ? 500 : 409,
    );
  }

  const { error: transError } = await service.from('wallet_transactions').insert({
    wallet_id: wallet.id,
    report_id: report.id,
    amount,
    transaction_type: 'debit',
    status: 'completed',
    reference_id: transactionReference,
  });

  if (transError) {
    console.error('Reward generate-paycode: transaction insert failed', transError.message);
    await restoreWallet();
    await rollbackMonnify('tx failure');
    return jsonError('Failed to record wallet transaction. Paycode was cancelled.', 500);
  }

  const { data: updatedReport, error: updateError } = await service
    .from('reports')
    .update({
      reward_paycode: monnifyResult.paycode,
      reward_status: 'paid',
      monnify_paycode_reference: monnifyResult.paycodeReference,
      monnify_transaction_reference: monnifyResult.transactionReference,
      reward_paycode_expires_at: expiresAt,
      reward_paycode_status: monnifyResult.transactionStatus || 'PENDING',
    })
    .eq('id', report.id)
    .eq('reward_status', 'pending_request')
    .is('reward_paycode', null)
    .select('id')
    .maybeSingle();

  if (updateError || !updatedReport) {
    console.error(
      'Reward generate-paycode: report update failed',
      updateError?.message || 'already processed',
    );
    await removeWalletTransaction();
    await restoreWallet();
    await rollbackMonnify('report failure');
    return jsonError('Failed to save paycode on report. Paycode was cancelled.', 500);
  }

  try {
    await notifyRewardPaycodeGenerated(report.id);
  } catch (notifyError) {
    console.error(
      'Reward generate-paycode: notification failed',
      notifyError?.message || notifyError,
    );
  }

  return Response.json({
    ok: true,
    reportId: report.id,
    report_id: report.report_id,
    // Clear paycode returned only to the authorizing super admin session
    paycode: monnifyResult.paycode,
    paycodeReference: monnifyResult.paycodeReference,
    expiresAt,
    status: monnifyResult.transactionStatus || 'PENDING',
  });
}
