import { notifyRewardPaycodeExpired } from '@/lib/email/notifications';

const PENDING_STATUS = 'PENDING';
const EXPIRED_STATUS = 'EXPIRED';

function isPastExpiry(expiresAt) {
  if (!expiresAt) return false;
  const expiryTime = new Date(expiresAt).getTime();
  return Number.isFinite(expiryTime) && expiryTime <= Date.now();
}

/**
 * Monnify has no webhook for paycode expiry, so we check lazily whenever a
 * report is viewed (track page, admin report page, etc.) instead of running
 * a scheduled job. If the paycode is still PENDING but past its expiry, mark
 * it EXPIRED and notify super admins once.
 */
export async function syncReportPaycodeExpiry(supabase, report) {
  if (!report || report.reward_paycode_status !== PENDING_STATUS) return report;
  if (!isPastExpiry(report.reward_paycode_expires_at)) return report;

  const { data: updated, error } = await supabase
    .from('reports')
    .update({ reward_paycode_status: EXPIRED_STATUS })
    .eq('id', report.id)
    .eq('reward_paycode_status', PENDING_STATUS)
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('syncReportPaycodeExpiry: update failed', error.message);
    return report;
  }
  if (!updated) {
    // Already transitioned (e.g. redeemed or expired) by a concurrent request.
    return report;
  }

  try {
    await notifyRewardPaycodeExpired(report.id);
  } catch (notifyError) {
    console.error(
      'syncReportPaycodeExpiry: notification failed',
      notifyError?.message || notifyError,
    );
  }

  return { ...report, ...updated };
}

/**
 * Batch version used when the admin Reward Management page loads — finds any
 * reward paycodes still marked PENDING but past their expiry, marks them
 * EXPIRED, and notifies super admins for each one.
 */
export async function syncAllPendingPaycodeExpiries(supabase) {
  const { data: candidates, error } = await supabase
    .from('reports')
    .select('id')
    .eq('reward_paycode_status', PENDING_STATUS)
    .lt('reward_paycode_expires_at', new Date().toISOString());

  if (error) {
    console.error('syncAllPendingPaycodeExpiries: lookup failed', error.message);
    return { checked: 0, expired: 0 };
  }

  let expiredCount = 0;
  for (const row of candidates || []) {
    const { data: updated, error: updateError } = await supabase
      .from('reports')
      .update({ reward_paycode_status: EXPIRED_STATUS })
      .eq('id', row.id)
      .eq('reward_paycode_status', PENDING_STATUS)
      .select('id')
      .maybeSingle();

    if (updateError || !updated) continue;

    expiredCount += 1;
    try {
      await notifyRewardPaycodeExpired(row.id);
    } catch (notifyError) {
      console.error(
        'syncAllPendingPaycodeExpiries: notification failed',
        notifyError?.message || notifyError,
      );
    }
  }

  return { checked: (candidates || []).length, expired: expiredCount };
}
