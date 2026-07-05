import { formatSupabaseError } from '@/lib/supabaseErrors';
import { jsonError } from '../../../track/_utils';
import { readPushBody } from '../../_utils';

export const runtime = 'nodejs';

function normalizeTrackingType(value) {
  return value === 'report' || value === 'bounty' ? value : '';
}

export async function POST(request) {
  const parsed = await readPushBody(request);
  if (parsed.error) return parsed.error;

  const { body, expoPushToken, service } = parsed;
  const trackingType = normalizeTrackingType(body?.trackingType);
  const trackingId = typeof body?.trackingId === 'string' ? body.trackingId.trim().toUpperCase() : '';

  if (!trackingType || !trackingId) {
    return jsonError('Tracking type and ID are required.');
  }

  const { error } = await service
    .from('push_tracking_subscriptions')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('expo_push_token', expoPushToken)
    .eq('tracking_type', trackingType)
    .eq('tracking_id', trackingId);

  if (error) {
    return Response.json({ error: formatSupabaseError(error) }, { status: 500 });
  }

  return Response.json({ ok: true });
}
