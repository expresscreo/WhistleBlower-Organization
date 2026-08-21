import { requireAuthenticatedAdmin } from '@/lib/email/auth';
import { serializeRewardForRole } from '@/lib/rewardSerialization';

export const runtime = 'nodejs';

const REPORT_FIELDS = [
  'id',
  'report_id',
  'organization_id',
  'title',
  'status',
  'is_anonymous',
  'is_feedback',
  'is_trashed',
  'reward_status',
  'reward_requested_amount',
  'reward_service_fee_rate',
  'reward_service_fee_amount',
  'reward_total_debit',
  'reward_paycode_expires_at',
  'reward_paycode_status',
  'created_at',
  'organizations(name)',
].join(',');

export async function GET(request) {
  const auth = await requireAuthenticatedAdmin(request);
  if (auth.error) return auth.error;

  const { profile, service } = auth;
  const isSuperAdmin = profile.user_type === 'super_admin';
  if (!isSuperAdmin && !profile.organization_id) {
    return Response.json({ rewards: [], eligibleReports: [] });
  }

  let rewardsQuery = service
    .from('reports')
    .select(REPORT_FIELDS)
    .eq('is_anonymous', false)
    .eq('is_feedback', false)
    .eq('is_trashed', false)
    .in('reward_status', ['pending_request', 'paid', 'rejected'])
    .order('created_at', { ascending: false });

  let eligibleQuery = service
    .from('reports')
    .select(REPORT_FIELDS)
    .eq('status', 'Resolved')
    .eq('is_anonymous', false)
    .eq('is_feedback', false)
    .eq('is_trashed', false);

  if (!isSuperAdmin) {
    rewardsQuery = rewardsQuery.eq('organization_id', profile.organization_id);
    eligibleQuery = eligibleQuery
      .eq('organization_id', profile.organization_id)
      .or('reward_status.is.null,reward_status.eq.rejected');
  } else {
    eligibleQuery = eligibleQuery.or(
      'reward_status.is.null,reward_status.eq.rejected,reward_status.eq.pending_request',
    );
  }

  const [
    { data: rewardRows, error: rewardsError },
    { data: eligibleRows, error: eligibleError },
  ] = await Promise.all([rewardsQuery, eligibleQuery]);

  if (rewardsError || eligibleError) {
    console.error(
      'Reward list: query failed',
      rewardsError?.message || eligibleError?.message,
    );
    return Response.json({ error: 'Could not load rewards.' }, { status: 500 });
  }

  const reportIds = [
    ...new Set(
      [...(rewardRows || []), ...(eligibleRows || [])].map((row) => row.id),
    ),
  ];
  let secretsByReport = new Map();
  if (reportIds.length > 0) {
    const { data: secretRows, error: secretsError } = await service
      .from('reward_paycode_secrets')
      .select('report_id, paycode')
      .in('report_id', reportIds);
    if (secretsError) {
      console.error('Reward list: secret lookup failed', secretsError.message);
      return Response.json({ error: 'Could not load reward status.' }, { status: 500 });
    }
    secretsByReport = new Map(
      (secretRows || []).map((row) => [row.report_id, row.paycode]),
    );
  }

  const serialize = (row) => {
    const paycode = secretsByReport.get(row.id) || null;
    return serializeRewardForRole(row, { isSuperAdmin, paycode });
  };

  return Response.json({
    rewards: (rewardRows || []).map(serialize),
    eligibleReports: (eligibleRows || [])
      .filter((row) => !secretsByReport.has(row.id))
      .map(serialize),
  });
}
