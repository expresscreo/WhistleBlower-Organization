/** Bounty lifecycle statuses (bounties.status — bounty_status enum in DB). */
export const BOUNTY_STATUS = {
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  PUBLISHED: 'published',
  REPORT_RECEIVED: 'report_received',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
  REFUNDED: 'refunded',
};

/** All bounty statuses (admin dropdown base list). */
export const ALL_BOUNTY_STATUSES = [
  BOUNTY_STATUS.PENDING_REVIEW,
  BOUNTY_STATUS.APPROVED,
  BOUNTY_STATUS.PUBLISHED,
  BOUNTY_STATUS.REPORT_RECEIVED,
  BOUNTY_STATUS.RESOLVED,
  BOUNTY_STATUS.REJECTED,
  BOUNTY_STATUS.REFUNDED,
];

/** Statuses where the public bounty page may remain visible. */
export const BOUNTY_STATUSES_WITH_PUBLIC_PAGE = [
  BOUNTY_STATUS.PUBLISHED,
  BOUNTY_STATUS.REPORT_RECEIVED,
  BOUNTY_STATUS.RESOLVED,
];

export function formatBountyStatusLabel(status) {
  if (!status) return '';
  return status
    .replace(/_/g, ' ')
    .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

/**
 * Admin dropdown options. report_received only appears when linked hunter
 * reports exist (or the bounty is already in that state).
 */
export function getAdminSelectableBountyStatuses(currentStatus, linkedHunterReportCount = 0) {
  return ALL_BOUNTY_STATUSES.filter((status) => {
    if (status !== BOUNTY_STATUS.REPORT_RECEIVED) return true;
    return linkedHunterReportCount > 0 || currentStatus === BOUNTY_STATUS.REPORT_RECEIVED;
  });
}

export function isValidAdminBountyStatusTransition(
  _fromStatus,
  toStatus,
  linkedHunterReportCount = 0
) {
  if (toStatus === BOUNTY_STATUS.REPORT_RECEIVED) {
    return linkedHunterReportCount > 0;
  }
  return true;
}

/** Count hunter tips linked to a bounty via bounty_reports. */
export async function countHunterSubmissionsForBounty(supabase, bountyId) {
  const reports = await fetchHunterReportsForBounty(supabase, bountyId);
  return reports.length;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const HUNTER_REPORT_COLUMNS = `
  id,
  report_id,
  title,
  description,
  status,
  created_at,
  incident_date,
  state,
  lga,
  is_voice_note,
  evidence_path
`;

/** Fetch hunter tips linked to a bounty, newest first. */
export async function fetchHunterReportsForBounty(supabase, bountyId) {
  const { data: links, error: linksError } = await supabase
    .from('bounty_reports')
    .select('report_id, created_at')
    .eq('bounty_id', bountyId)
    .order('created_at', { ascending: false });

  if (linksError) throw linksError;
  if (!links?.length) return [];

  const linkIds = [...new Set(links.map((link) => link.report_id).filter(Boolean))];
  if (!linkIds.length) return [];

  const uuidIds = linkIds.filter((value) => UUID_RE.test(value));
  const publicIds = linkIds.filter((value) => !UUID_RE.test(value));

  const reportQueries = [];

  if (uuidIds.length) {
    reportQueries.push(
      supabase
        .from('reports')
        .select(HUNTER_REPORT_COLUMNS)
        .in('id', uuidIds)
        .eq('is_trashed', false)
    );
  }

  if (publicIds.length) {
    reportQueries.push(
      supabase
        .from('reports')
        .select(HUNTER_REPORT_COLUMNS)
        .in('report_id', publicIds)
        .eq('is_trashed', false)
    );
  }

  const reportResults = await Promise.all(reportQueries);
  const reportsError = reportResults.find((result) => result.error)?.error;
  if (reportsError) throw reportsError;

  const reports = reportResults.flatMap((result) => result.data || []);
  const reportByLinkId = new Map();

  for (const report of reports) {
    reportByLinkId.set(report.id, report);
    if (report.report_id) {
      reportByLinkId.set(report.report_id, report);
    }
  }

  const seen = new Set();
  const uniqueReports = [];
  for (const link of links) {
    const report = reportByLinkId.get(link.report_id);
    if (!report || seen.has(report.id)) continue;
    seen.add(report.id);
    uniqueReports.push(report);
  }

  return uniqueReports;
}

/** @deprecated Use countHunterSubmissionsForBounty */
export const countHunterReportsForBounty = countHunterSubmissionsForBounty;

export async function linkHunterReportToBounty(
  supabase,
  bountyId,
  { reportRowId, publicReportId }
) {
  const candidates = [];

  if (publicReportId) candidates.push(publicReportId);

  if (reportRowId && !candidates.includes(reportRowId)) {
    candidates.push(reportRowId);
  }

  if (!reportRowId && publicReportId) {
    const { data, error } = await supabase
      .from('reports')
      .select('id')
      .eq('report_id', publicReportId)
      .maybeSingle();

    if (error) throw error;
    if (data?.id && !candidates.includes(data.id)) {
      candidates.push(data.id);
    }
  }

  if (candidates.length === 0) {
    throw new Error('Could not resolve created report for bounty link.');
  }

  let lastError = null;

  for (const reportId of candidates) {
    const { error } = await supabase
      .from('bounty_reports')
      .insert({ bounty_id: bountyId, report_id: reportId });

    if (!error) return;

    lastError = error;

    if (/duplicate|unique/i.test(error.message || '')) {
      return;
    }
  }

  throw lastError;
}
