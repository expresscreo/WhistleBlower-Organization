import {
  authenticateReport,
  createSignedEvidenceUrl,
  entityOwnsEvidencePath,
  jsonError,
  normalizeIdentifier,
  readJson,
} from '../../_utils';

export const runtime = 'nodejs';

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return jsonError('Invalid request body.');

  const path = normalizeIdentifier(body.path);
  if (!path) return jsonError('File path is required.');

  try {
    const auth = await authenticateReport(body.reportId, body.password);
    if (auth.error) return jsonError(auth.error, auth.status);

    const { report, supabase } = auth;

    if (!entityOwnsEvidencePath(report, path)) {
      return jsonError('This file is not attached to your report.', 404);
    }

    const result = await createSignedEvidenceUrl(supabase, path);
    if (result.error) return jsonError(result.error, result.status);

    return Response.json({ signedUrl: result.signedUrl });
  } catch (error) {
    console.error('Track report media access failed:', error);
    return jsonError('Could not access this file.', 500);
  }
}
