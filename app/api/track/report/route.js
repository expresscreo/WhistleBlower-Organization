import {
  attachReporterPaycode,
  authenticateReport,
  jsonError,
  readJson,
  sanitizeReport,
} from '../_utils';
import { syncReportPaycodeExpiry } from '@/lib/monnify/paycodeLifecycle';

export const runtime = 'nodejs';

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return jsonError('Invalid request body.');

  try {
    const auth = await authenticateReport(body.reportId, body.password);
    if (auth.error) return jsonError(auth.error, auth.status);

    const { report, supabase } = auth;

    await supabase
      .from('reports')
      .update({ reporter_has_viewed: true })
      .eq('id', report.id);

    // Monnify has no expiry webhook — lazily catch an overdue pending
    // paycode whenever the reporter views their report.
    const syncedReport = await syncReportPaycodeExpiry(supabase, report);
    const reportWithPaycode = await attachReporterPaycode(supabase, {
      ...syncedReport,
      reporter_has_viewed: true,
    });

    const { data: updates, error: updatesError } = await supabase
      .from('report_updates')
      .select('*')
      .eq('report_id', report.id)
      .order('created_at', { ascending: true });

    if (updatesError) throw updatesError;

    return Response.json({
      report: sanitizeReport(reportWithPaycode),
      updates: updates || [],
    });
  } catch (error) {
    console.error('Report tracking authentication failed:', error);
    return jsonError('Could not access this report.', 500);
  }
}
