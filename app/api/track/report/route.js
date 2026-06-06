import {
  authenticateReport,
  jsonError,
  readJson,
  sanitizeReport,
} from '../_utils';

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

    const { data: updates, error: updatesError } = await supabase
      .from('report_updates')
      .select('*')
      .eq('report_id', report.id)
      .order('created_at', { ascending: true });

    if (updatesError) throw updatesError;

    return Response.json({
      report: sanitizeReport({ ...report, reporter_has_viewed: true }),
      updates: updates || [],
    });
  } catch (error) {
    console.error('Report tracking authentication failed:', error);
    return jsonError('Could not access this report.', 500);
  }
}
