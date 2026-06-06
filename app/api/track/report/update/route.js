import {
  authenticateReport,
  jsonError,
  normalizeEvidencePaths,
  normalizeMessage,
  readJson,
  sanitizeReport,
} from '../../_utils';

export const runtime = 'nodejs';

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return jsonError('Invalid request body.');

  const message = normalizeMessage(body.message);
  const evidencePaths = normalizeEvidencePaths(body.evidencePaths);
  if (!message && evidencePaths.length === 0) {
    return jsonError('Please add a message or files.');
  }

  try {
    const auth = await authenticateReport(body.reportId, body.password);
    if (auth.error) return jsonError(auth.error, auth.status);

    const { report, supabase } = auth;
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const updateIdentifier = message
      ? `\n\n--- UPDATE (${timestamp}) ---\n${message}`
      : '';
    const updatedEvidence = [
      ...(Array.isArray(report.evidence_path) ? report.evidence_path : []),
      ...evidencePaths,
    ];

    const { data: updatedReport, error: reportError } = await supabase
      .from('reports')
      .update({
        description: `${report.description || ''}${updateIdentifier}`,
        evidence_path: updatedEvidence,
        admin_has_viewed: false,
      })
      .eq('id', report.id)
      .select()
      .single();

    if (reportError) throw reportError;

    const updateMessage = [
      message ? `Report updated: ${message}` : 'Report evidence updated.',
      evidencePaths.length > 0
        ? `Added ${evidencePaths.length} new file(s).`
        : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    const { data: update, error: updateError } = await supabase
      .from('report_updates')
      .insert({
        report_id: report.id,
        message: updateMessage,
        updated_by: null,
        is_read: false,
        is_read_by_admin: false,
        is_read_by_reporter: true,
      })
      .select()
      .single();

    if (updateError) {
      console.error('Failed to add report update message:', updateError);
    }

    return Response.json({
      report: sanitizeReport(updatedReport),
      update,
    });
  } catch (error) {
    console.error('Report update failed:', error);
    return jsonError('Could not update your report.', 500);
  }
}
