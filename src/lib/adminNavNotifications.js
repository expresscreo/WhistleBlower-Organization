import { supabase } from '@/lib/customSupabaseClient';
import { isPlatformAdmin } from '@/lib/platformAccess';

function isSuperAdmin(profile) {
  return profile?.user_type === 'super_admin';
}

function applyReportOrgFilter(query, profile) {
  if (!isSuperAdmin(profile) && profile?.organization_id) {
    return query.eq('organization_id', profile.organization_id);
  }
  return query;
}

function uniqueIds(...lists) {
  const ids = new Set();
  for (const list of lists) {
    for (const id of list || []) {
      if (id) ids.add(id);
    }
  }
  return ids.size;
}

function mergeReportIds(unseenRows = [], unreadReportIds = [], scopedUnreadRows = []) {
  const ids = new Set();
  for (const row of unseenRows) {
    if (row?.id) ids.add(row.id);
  }
  const scopedIds = new Set(scopedUnreadRows.map((row) => row.id));
  for (const reportId of unreadReportIds) {
    if (scopedIds.has(reportId)) ids.add(reportId);
  }
  return ids.size;
}

async function countStandardReports(profile, { feedbackOnly = false, mostWantedOnly = false, skipOrgFilter = false } = {}) {
  let unseenQuery = supabase
    .from('reports')
    .select('id')
    .eq('is_trashed', false)
    .eq('admin_has_viewed', false);

  if (feedbackOnly) {
    unseenQuery = unseenQuery.eq('is_feedback', true);
  } else {
    unseenQuery = unseenQuery.eq('is_feedback', false);
    if (mostWantedOnly) {
      unseenQuery = unseenQuery.ilike('category', 'most wanted');
    } else {
      unseenQuery = unseenQuery.not('category', 'ilike', 'bounty').not('category', 'ilike', 'most wanted');
    }
  }

  if (!skipOrgFilter) {
    unseenQuery = applyReportOrgFilter(unseenQuery, profile);
  }

  const { data: unseenRows, error: unseenError } = await unseenQuery;
  if (unseenError) throw unseenError;

  const { data: unreadRows, error: unreadError } = await supabase
    .from('report_updates')
    .select('report_id')
    .eq('is_read_by_admin', false)
    .is('updated_by', null);

  if (unreadError) throw unreadError;

  const unreadReportIds = [...new Set((unreadRows || []).map((row) => row.report_id).filter(Boolean))];
  if (unreadReportIds.length === 0) {
    return unseenRows?.length || 0;
  }

  let scopedUnreadQuery = supabase
    .from('reports')
    .select('id')
    .in('id', unreadReportIds)
    .eq('is_trashed', false);

  if (feedbackOnly) {
    scopedUnreadQuery = scopedUnreadQuery.eq('is_feedback', true);
  } else {
    scopedUnreadQuery = scopedUnreadQuery.eq('is_feedback', false);
    if (mostWantedOnly) {
      scopedUnreadQuery = scopedUnreadQuery.ilike('category', 'most wanted');
    } else {
      scopedUnreadQuery = scopedUnreadQuery
        .not('category', 'ilike', 'bounty')
        .not('category', 'ilike', 'most wanted');
    }
  }

  if (!skipOrgFilter) {
    scopedUnreadQuery = applyReportOrgFilter(scopedUnreadQuery, profile);
  }

  const { data: scopedUnreadRows, error: scopedUnreadError } = await scopedUnreadQuery;
  if (scopedUnreadError) throw scopedUnreadError;

  return mergeReportIds(unseenRows, unreadReportIds, scopedUnreadRows);
}

async function countBounties(profile) {
  if (!isPlatformAdmin(profile)) return 0;

  const { data: unseenBounties, error: bountyError } = await supabase
    .from('bounties')
    .select('id')
    .eq('is_trashed', false)
    .eq('admin_has_viewed', false);

  if (bountyError) throw bountyError;

  const { data: unseenReports, error: reportError } = await supabase
    .from('reports')
    .select('id, bounty_reports!inner(bounty_id)')
    .eq('category', 'Bounty')
    .eq('is_trashed', false)
    .eq('admin_has_viewed', false);
  if (reportError) throw reportError;

  const { data: unreadBountyMessages, error: unreadError } = await supabase
    .from('bounty_updates')
    .select('bounty_id')
    .eq('is_read_by_admin', false)
    .is('updated_by', null);

  if (unreadError) throw unreadError;

  const unreadBountyIds = [...new Set((unreadBountyMessages || []).map((row) => row.bounty_id).filter(Boolean))];

  if (unreadBountyIds.length > 0) {
    const { data: unreadBounties, error: unreadBountiesError } = await supabase
      .from('bounties')
      .select('id')
      .in('id', unreadBountyIds)
      .eq('is_trashed', false);

    if (unreadBountiesError) throw unreadBountiesError;

    return uniqueIds(
      (unseenBounties || []).map((row) => row.id),
      (unseenReports || []).map((row) => row.id),
      (unreadBounties || []).map((row) => row.id)
    );
  }

  return uniqueIds(
    (unseenBounties || []).map((row) => row.id),
    (unseenReports || []).map((row) => row.id)
  );
}

async function countNewsEditorDrafts() {
  const { count, error } = await supabase
    .from('news')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'draft');

  if (error) throw error;
  return count || 0;
}

async function countUnmatchedOrganizations() {
  const { count, error } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('is_trashed', false)
    .is('organization_id', null)
    .not('organization_name', 'is', null)
    .not('category', 'ilike', 'bounty')
    .not('category', 'ilike', 'most wanted');

  if (error) throw error;
  return count || 0;
}

async function countRewards(profile) {
  if (isSuperAdmin(profile)) {
    const [pendingResult, resolvedResult] = await Promise.all([
      supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('reward_status', 'pending_request')
        .eq('is_anonymous', false)
        .eq('is_trashed', false),
      supabase
        .from('reports')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'Resolved')
        .eq('is_anonymous', false)
        .eq('is_trashed', false)
        .is('reward_paycode', null)
        .or('reward_status.is.null,reward_status.eq.rejected'),
    ]);

    if (pendingResult.error) throw pendingResult.error;
    if (resolvedResult.error) throw resolvedResult.error;
    return (pendingResult.count || 0) + (resolvedResult.count || 0);
  }

  if (!profile?.organization_id) return 0;

  const { count, error } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', profile.organization_id)
    .eq('status', 'Resolved')
    .eq('is_anonymous', false)
    .eq('is_trashed', false)
    .is('reward_paycode', null)
    .or('reward_status.is.null,reward_status.eq.rejected');

  if (error) throw error;
  return count || 0;
}

export const ADMIN_NOTIFICATION_KEYS = {
  reports: 'reports',
  bounties: 'bounties',
  mostWanted: 'mostWanted',
  feedback: 'feedback',
  newsEditor: 'newsEditor',
  unmatchedOrgs: 'unmatchedOrgs',
  reward: 'reward',
};

export const PAGE_NAME_TO_NOTIFICATION_KEY = {
  Reports: ADMIN_NOTIFICATION_KEYS.reports,
  Bounties: ADMIN_NOTIFICATION_KEYS.bounties,
  'Most Wanted': ADMIN_NOTIFICATION_KEYS.mostWanted,
  'Customer Feedback': ADMIN_NOTIFICATION_KEYS.feedback,
  'News Editor': ADMIN_NOTIFICATION_KEYS.newsEditor,
  'Unmatched Organization': ADMIN_NOTIFICATION_KEYS.unmatchedOrgs,
  Reward: ADMIN_NOTIFICATION_KEYS.reward,
};

export async function fetchAdminNavNotifications(profile) {
  if (!profile?.id) {
    return {
      reports: 0,
      bounties: 0,
      mostWanted: 0,
      feedback: 0,
      newsEditor: 0,
      unmatchedOrgs: 0,
      reward: 0,
    };
  }

  const [
    reports,
    bounties,
    mostWanted,
    feedback,
    newsEditor,
    unmatchedOrgs,
    reward,
  ] = await Promise.all([
    countStandardReports(profile),
    countBounties(profile),
    isPlatformAdmin(profile)
      ? countStandardReports(profile, { mostWantedOnly: true, skipOrgFilter: true })
      : Promise.resolve(0),
    countStandardReports(profile, { feedbackOnly: true }),
    countNewsEditorDrafts(),
    countUnmatchedOrganizations(),
    countRewards(profile),
  ]);

  return {
    reports,
    bounties,
    mostWanted,
    feedback,
    newsEditor,
    unmatchedOrgs,
    reward,
  };
}
