import { jsonError } from '@/lib/httpJson';
import { requireAuthenticatedAdmin } from '@/lib/email/auth';
import { syncAllPendingPaycodeExpiries } from '@/lib/monnify/paycodeLifecycle';

export const runtime = 'nodejs';

export async function POST(request) {
  const auth = await requireAuthenticatedAdmin(request);
  if (auth.error) return auth.error;

  if (auth.profile.user_type !== 'super_admin') {
    return jsonError('Only platform super admins can sync paycode status.', 403);
  }

  const result = await syncAllPendingPaycodeExpiries(auth.service);
  return Response.json({ ok: true, ...result });
}
