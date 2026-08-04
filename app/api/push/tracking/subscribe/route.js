import { formatSupabaseError } from '@/lib/supabaseErrors';
import { jsonError } from '../../../track/_utils';
import { normalizePreferences, readPushBody } from '../../_utils';

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
  const displayLabel = typeof body?.displayLabel === 'string' ? body.displayLabel.trim().slice(0, 120) : trackingId;
  const platform = ['ios', 'android', 'web'].includes(body?.platform) ? body.platform : 'unknown';
  const preferences = normalizePreferences(body?.preferences);

  if (!trackingType || !trackingId) {
    return jsonError('Tracking type and ID are required.');
  }

  const { error: tokenError } = await service.from('push_tokens').upsert(
    {
      expo_push_token: expoPushToken,
      platform,
      preferences,
      is_active: true,
      last_registered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'expo_push_token' }
  );

  if (tokenError) {
    return Response.json({ error: formatSupabaseError(tokenError) }, { status: 500 });
  }

  const { error } = await service.from('push_tracking_subscriptions').upsert(
    {
      expo_push_token: expoPushToken,
      tracking_type: trackingType,
      tracking_id: trackingId,
      display_label: displayLabel || trackingId,
      is_active: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'expo_push_token,tracking_type,tracking_id' }
  );

  if (error) {
    return Response.json({ error: formatSupabaseError(error) }, { status: 500 });
  }

  return Response.json({ ok: true });
}
