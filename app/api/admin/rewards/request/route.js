import { jsonError, readJson } from '@/lib/httpJson';
import { requireAuthenticatedAdmin } from '@/lib/email/auth';
import { notifyRewardRequest } from '@/lib/email/notifications';
import { calculateRewardCharge } from '@/lib/rewardFees';

export const runtime = 'nodejs';

const REQUEST_ROLES = new Set(['organization_admin', 'executive_admin']);

export async function POST(request) {
  const auth = await requireAuthenticatedAdmin(request);
  if (auth.error) return auth.error;

  const { profile, service } = auth;
  if (!REQUEST_ROLES.has(profile.user_type) || !profile.organization_id) {
    return jsonError('Only organization administrators can request rewards.', 403);
  }

  const body = await readJson(request);
  const reportId = typeof body?.reportId === 'string' ? body.reportId.trim() : '';
  const amount = Number(body?.amount);
  if (!reportId || !Number.isFinite(amount) || amount <= 0) {
    return jsonError('A resolved report and valid reward amount are required.');
  }

  const [{ data: organization, error: orgError }, { data: report, error: reportError }] =
    await Promise.all([
      service
        .from('organizations')
        .select('id, status')
        .eq('id', profile.organization_id)
        .maybeSingle(),
      service
        .from('reports')
        .select(
          'id, report_id, organization_id, status, is_anonymous, is_feedback, is_trashed, reward_status',
        )
        .eq('id', reportId)
        .maybeSingle(),
    ]);

  if (orgError || !organization) {
    return jsonError('Could not load organization.', 500);
  }
  if (organization.status !== 'active') {
    return jsonError('Only active organizations can request rewards.', 403);
  }
  if (reportError || !report || report.organization_id !== organization.id) {
    return jsonError('Report not found.', 404);
  }
  if (
    report.status !== 'Resolved' ||
    report.is_anonymous !== false ||
    report.is_feedback ||
    report.is_trashed
  ) {
    return jsonError('This report is not eligible for a reward.');
  }
  if (report.reward_status && report.reward_status !== 'rejected') {
    return jsonError('A reward request already exists for this report.');
  }

  const { data: existingSecret, error: secretError } = await service
    .from('reward_paycode_secrets')
    .select('report_id')
    .eq('report_id', report.id)
    .maybeSingle();
  if (secretError) {
    return jsonError('Could not verify reward eligibility.', 500);
  }
  if (existingSecret) {
    return jsonError('A paycode has already been issued for this report.');
  }

  const charge = calculateRewardCharge(amount);
  const { data: wallet, error: walletError } = await service
    .from('organization_wallets')
    .select('id, balance')
    .eq('organization_id', organization.id)
    .maybeSingle();

  if (walletError || !wallet) {
    return jsonError('Organization wallet not found.');
  }
  if (Number(wallet.balance) < charge.totalDebit) {
    return jsonError(
      `Insufficient wallet balance. Reward plus service charge is ₦${charge.totalDebit.toLocaleString()}.`,
    );
  }

  const { data: updated, error: updateError } = await service
    .from('reports')
    .update({
      reward_requested_amount: charge.rewardAmount,
      reward_service_fee_rate: charge.serviceFeeRate,
      reward_service_fee_amount: charge.serviceFee,
      reward_total_debit: charge.totalDebit,
      reward_status: 'pending_request',
    })
    .eq('id', report.id)
    .eq('organization_id', organization.id)
    .in('reward_status', ['rejected'])
    .select('id')
    .maybeSingle();

  // Supabase's `in` does not match NULL, so retry only for a fresh request.
  let saved = updated;
  let saveError = updateError;
  if (!saved && !saveError && !report.reward_status) {
    const result = await service
      .from('reports')
      .update({
        reward_requested_amount: charge.rewardAmount,
        reward_service_fee_rate: charge.serviceFeeRate,
        reward_service_fee_amount: charge.serviceFee,
        reward_total_debit: charge.totalDebit,
        reward_status: 'pending_request',
      })
      .eq('id', report.id)
      .eq('organization_id', organization.id)
      .is('reward_status', null)
      .select('id')
      .maybeSingle();
    saved = result.data;
    saveError = result.error;
  }

  if (saveError || !saved) {
    return jsonError('Reward request changed. Refresh and try again.', 409);
  }

  try {
    await notifyRewardRequest(report.id);
  } catch (notifyError) {
    console.error('Reward request notification failed', notifyError?.message || notifyError);
  }

  return Response.json({ ok: true, ...charge });
}
