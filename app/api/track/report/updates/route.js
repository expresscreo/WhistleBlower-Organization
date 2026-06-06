import {
  authenticateReport,
  jsonError,
  readJson,
} from '../../_utils';

export const runtime = 'nodejs';

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return jsonError('Invalid request body.');

  try {
    const auth = await authenticateReport(body.reportId, body.password);
    if (auth.error) return jsonError(auth.error, auth.status);

    const { report, supabase } = auth;
    const { data, error } = await supabase
      .from('report_updates')
      .select('*')
      .eq('report_id', report.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return Response.json({ updates: data || [] });
  } catch (error) {
    console.error('Report updates fetch failed:', error);
    return jsonError('Could not load report updates.', 500);
  }
}
