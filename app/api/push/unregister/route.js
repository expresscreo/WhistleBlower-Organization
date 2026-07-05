import { formatSupabaseError } from '@/lib/supabaseErrors';
import { readPushBody } from '../_utils';

export const runtime = 'nodejs';

export async function POST(request) {
  const parsed = await readPushBody(request);
  if (parsed.error) return parsed.error;

  const { expoPushToken, service } = parsed;
  const { error } = await service
    .from('push_tokens')
    .update({
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('expo_push_token', expoPushToken);

  if (error) {
    return Response.json({ error: formatSupabaseError(error) }, { status: 500 });
  }

  return Response.json({ ok: true });
}
