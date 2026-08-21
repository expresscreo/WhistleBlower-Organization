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
import { calculateRewardCharge } from '@/lib/rewardFees';

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
      'id, report_id, organization_id, status, is_anonymous, reward_status, reward_requested_amount',
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
  const { data: existingSecret, error: secretError } = await service
    .from('reward_paycode_secrets')
    .select('report_id')
    .eq('report_id', report.id)
    .maybeSingle();
  if (secretError) {
    return jsonError('Could not verify paycode status.', 500);
  }
  if (existingSecret) {
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
  }

  const charge = calculateRewardCharge(amount);

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
  if (Number(wallet.balance) < charge.totalDebit) {
    return jsonError(
      `Organization needs ₦${charge.totalDebit.toLocaleString()} for the reward and 10% service charge.`,
    );
  }

  const paycodeReference = `REWARD-${report.report_id}-${randomUUID()}`;
  const expiryDate = defaultPaycodeExpiryDate();

  let monnifyResult;
  try {
    monnifyResult = await createPaycode({
      amount: charge.rewardAmount,
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

  const { error: finalizeError } = await service.rpc(
    'finalize_reward_paycode_issue',
    {
      p_report_id: report.id,
      p_reward_amount: charge.rewardAmount,
      p_service_fee: charge.serviceFee,
      p_total_debit: charge.totalDebit,
      p_service_fee_rate: charge.serviceFeeRate,
      p_paycode: monnifyResult.paycode,
      p_paycode_reference: monnifyResult.paycodeReference,
      p_transaction_reference: monnifyResult.transactionReference,
      p_expires_at: expiresAt,
      p_paycode_status: monnifyResult.transactionStatus || 'PENDING',
    },
  );

  if (finalizeError) {
    console.error(
      'Reward generate-paycode: atomic finalization failed',
      finalizeError.message,
    );
    await rollbackMonnify('database finalization failure');
    const insufficient = /insufficient_wallet_funds/i.test(finalizeError.message);
    return jsonError(
      insufficient
        ? 'Organization wallet balance changed and is now insufficient. Paycode was cancelled.'
        : 'Failed to record the paycode. Paycode was cancelled.',
      insufficient ? 409 : 500,
    );
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
    rewardAmount: charge.rewardAmount,
    serviceFee: charge.serviceFee,
    totalDebit: charge.totalDebit,
  });
}
