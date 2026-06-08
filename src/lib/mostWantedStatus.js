const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function formatSupabaseError(error, fallback = 'Request failed.') {
  if (!error) return fallback;
  return [error.message, error.details, error.hint, error.code].filter(Boolean).join(' ') || fallback;
}

export function isMissingMostWantedReportsTable(error) {
  const message = formatSupabaseError(error, '');
  return /most_wanted_reports|does not exist|PGRST205|42P01|schema cache/i.test(message);
}

function buildReportLookup(reports = []) {
  const reportByLinkId = new Map();
  for (const report of reports) {
    reportByLinkId.set(report.id, report);
    if (report.report_id) {
      reportByLinkId.set(report.report_id, report);
    }
  }
  return reportByLinkId;
}

/** Load all join rows; returns [] when the migration has not been applied yet. */
export async function fetchAllMostWantedLinks(supabase) {
  const { data, error } = await supabase
    .from('most_wanted_reports')
    .select('news_id, report_id, created_at');

  if (error) {
    if (isMissingMostWantedReportsTable(error)) {
      return [];
    }
    throw error;
  }

  return data || [];
}

/** Shape alerts + sighting tips for the admin list page. */
export function buildMostWantedAdminItems({ alerts = [], reports = [], links = [] }) {
  const reportByLinkId = buildReportLookup(reports);
  const linkedReportIds = new Set();
  const newsIdByReportId = new Map();

  for (const link of links) {
    const report = reportByLinkId.get(link.report_id);
    if (!report) continue;
    linkedReportIds.add(report.id);
    newsIdByReportId.set(report.id, link.news_id);
  }

  const formattedLinkedReports = reports
    .filter((report) => linkedReportIds.has(report.id))
    .map((report) => ({
      ...report,
      item_type: 'report',
      news_id: newsIdByReportId.get(report.id) ?? null,
    }));

  const formattedOrphanReports = reports
    .filter((report) => !linkedReportIds.has(report.id))
    .map((report) => ({
      ...report,
      item_type: 'report',
      news_id: null,
    }));

  const linkedReportCountByAlert = formattedLinkedReports.reduce((counts, report) => {
    const alertId = report.news_id;
    if (alertId) {
      counts[alertId] = (counts[alertId] || 0) + 1;
    }
    return counts;
  }, {});

  const formattedAlerts = alerts.map((alert) => ({
    ...alert,
    item_type: 'alert',
    linked_report_count: linkedReportCountByAlert[alert.id] || 0,
  }));

  return [...formattedAlerts, ...formattedLinkedReports, ...formattedOrphanReports];
}

const SIGHTING_REPORT_COLUMNS = `
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

/** Count sighting tips linked to a Most Wanted alert via most_wanted_reports. */
export async function countSightingSubmissionsForAlert(supabase, newsId) {
  const reports = await fetchSightingReportsForAlert(supabase, newsId);
  return reports.length;
}

/** Fetch sighting tips linked to an alert, newest first. */
export async function fetchSightingReportsForAlert(supabase, newsId) {
  const { data: links, error: linksError } = await supabase
    .from('most_wanted_reports')
    .select('report_id, created_at')
    .eq('news_id', newsId)
    .order('created_at', { ascending: false });

  if (linksError) {
    if (isMissingMostWantedReportsTable(linksError)) return [];
    throw linksError;
  }
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
        .select(SIGHTING_REPORT_COLUMNS)
        .in('id', uuidIds)
        .eq('is_trashed', false)
    );
  }

  if (publicIds.length) {
    reportQueries.push(
      supabase
        .from('reports')
        .select(SIGHTING_REPORT_COLUMNS)
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

export async function linkSightingReportToMostWanted(
  supabase,
  newsId,
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
    throw new Error('Could not resolve created report for Most Wanted link.');
  }

  let lastError = null;

  for (const reportId of candidates) {
    const { error } = await supabase
      .from('most_wanted_reports')
      .insert({ news_id: newsId, report_id: reportId });

    if (!error) return;

    lastError = error;

    if (/duplicate|unique/i.test(error.message || '')) {
      return;
    }
  }

  throw lastError;
}
