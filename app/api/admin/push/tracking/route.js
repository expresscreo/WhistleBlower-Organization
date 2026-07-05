import { dispatchTrackingUpdatePush } from '@/lib/push/notifications';
import { formatSupabaseError } from '@/lib/supabaseErrors';
import { requireAuthenticatedAdmin, requireReportAccess } from '@/lib/email/auth';
import { jsonError, readJson } from '../../../track/_utils';

export const runtime = 'nodejs';

export async function POST(request) {
  const auth = await requireAuthenticatedAdmin(request);
  if (auth.error) return auth.error;

  const body = await readJson(request);
  const trackingType = body?.trackingType === 'bounty' ? 'bounty' : body?.trackingType === 'report' ? 'report' : '';
  const trackingId = typeof body?.trackingId === 'string' ? body.trackingId.trim().toUpperCase() : '';

  if (!trackingType || !trackingId) {
    return jsonError('Tracking type and ID are required.');
  }

  try {
    if (trackingType === 'report') {
      const { data: report, error: reportError } = await auth.service
        .from('reports')
        .select('id')
        .eq('report_id', trackingId)
        .maybeSingle();

      if (reportError || !report) {
        return jsonError('Report not found.', 404);
      }

      const access = await requireReportAccess(auth.service, auth.profile, report.id);
      if (access.error) return access.error;
    }

    const result = await dispatchTrackingUpdatePush(auth.service, { trackingType, trackingId });
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error('Tracking push notification failed:', error);
    return jsonError(formatSupabaseError(error), 500);
  }
}
