import { randomUUID } from 'crypto';
import { jsonError, readJson } from '@/lib/httpJson';
import { requireAuthenticatedAdmin } from '@/lib/email/auth';
import { emailConfig } from '@/lib/email/config';
import { initializeDepositTransaction } from '@/lib/monnify/collections';

export const runtime = 'nodejs';

const DEPOSIT_ROLES = new Set(['organization_admin', 'executive_admin']);

export async function POST(request) {
  const auth = await requireAuthenticatedAdmin(request);
  if (auth.error) return auth.error;

  const { profile, user, service } = auth;
  if (!DEPOSIT_ROLES.has(profile.user_type)) {
    return jsonError('Only organization admins can deposit reward funds.', 403);
  }
  if (!profile.organization_id) {
    return jsonError('Your account is not linked to an organization.', 403);
  }

  const body = await readJson(request);
  const amount = Number(body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return jsonError('Please provide a valid deposit amount.');
  }

  const { data: organization, error: orgError } = await service
    .from('organizations')
    .select('id, name, status')
    .eq('id', profile.organization_id)
    .maybeSingle();

  if (orgError) {
    console.error('Reward deposit: organization lookup failed', orgError.message);
    return jsonError('Could not load organization.', 500);
  }
  if (!organization) {
    return jsonError('Organization not found.', 404);
  }
  if (organization.status !== 'active') {
    return jsonError('Only verified organizations can deposit reward funds.');
  }

  const { data: walletId, error: walletError } = await service.rpc(
    'get_or_create_wallet',
    { org_id: organization.id },
  );
  if (walletError || !walletId) {
    console.error('Reward deposit: wallet ensure failed', walletError?.message);
    return jsonError('Could not load organization wallet.', 500);
  }

  const origin = (request.headers.get('origin') || emailConfig.appUrl).replace(/\/$/, '');
  const paymentReference = `DEPOSIT-${organization.id}-${randomUUID()}`;
  const customerEmail = user?.email;
  if (!customerEmail) {
    return jsonError('Your account does not have an email address.');
  }

  try {
    const result = await initializeDepositTransaction({
      amount,
      paymentReference,
      customerName: organization.name || 'WhistleBlower Organization',
      customerEmail,
      organizationId: organization.id,
      redirectUrl: `${origin}/admin/reward?deposit=success`,
    });

    return Response.json({
      ok: true,
      checkoutUrl: result.checkoutUrl,
      paymentReference: result.paymentReference,
    });
  } catch (error) {
    console.error('Reward deposit: Monnify init failed', error?.message || error);
    return jsonError(error?.message || 'Failed to start Monnify deposit.', 502);
  }
}
