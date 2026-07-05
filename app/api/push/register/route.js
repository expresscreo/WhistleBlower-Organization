import { formatSupabaseError } from '@/lib/supabaseErrors';
import { normalizePreferences, readPushBody } from '../_utils';

export const runtime = 'nodejs';

export async function POST(request) {
  const parsed = await readPushBody(request);
  if (parsed.error) return parsed.error;

  const { body, expoPushToken, service } = parsed;
  const platform = ['ios', 'android', 'web'].includes(body?.platform) ? body.platform : 'unknown';
  const preferences = normalizePreferences(body?.preferences);

  const { error } = await service.from('push_tokens').upsert(
    {
      expo_push_token: expoPushToken,
      platform,
      preferences,
      is_active: true,
      last_registered_at: new Date().toISOString(),
    },
    { onConflict: 'expo_push_token' }
  );

  if (error) {
    return Response.json({ error: formatSupabaseError(error) }, { status: 500 });
  }

  return Response.json({ ok: true });
}
