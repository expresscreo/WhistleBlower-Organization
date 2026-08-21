import { randomUUID } from 'crypto';
import { jsonError, readJson } from '@/lib/httpJson';
import { requireAuthenticatedAdmin } from '@/lib/email/auth';
import { emailConfig } from '@/lib/email/config';
import { initializeDepositTransaction } from '@/lib/monnify/collections';
import { serverEnv } from '@/lib/env';
import { calculateDepositQuote } from '@/lib/rewardFees';

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

  const feeConfig = {
    feeRate: serverEnv.monnifyCollectionFeeRate,
    vatRate: serverEnv.monnifyCollectionFeeVatRate,
    feeCapNaira: serverEnv.monnifyCollectionFeeCap,
  };
  const quote = calculateDepositQuote(amount, feeConfig);

  const { data: intent, error: intentError } = await service
    .from('wallet_deposit_intents')
    .insert({
      organization_id: organization.id,
      wallet_id: walletId,
      created_by: profile.id,
      payment_reference: paymentReference,
      wallet_credit_amount: quote.walletCredit,
      processing_fee_amount: quote.processingFee,
      gross_amount: quote.totalPayable,
      fee_rate: feeConfig.feeRate,
      fee_vat_rate: feeConfig.vatRate,
      fee_cap_amount: feeConfig.feeCapNaira,
      status: 'pending',
    })
    .select('id')
    .single();

  if (intentError || !intent) {
    console.error('Reward deposit: intent creation failed', intentError?.message);
    return jsonError('Could not prepare the organization deposit.', 500);
  }

  try {
    const result = await initializeDepositTransaction({
      amount: quote.totalPayable,
      paymentReference,
      customerName: organization.name || 'WhistleBlower Organization',
      customerEmail,
      organizationId: organization.id,
      depositIntentId: intent.id,
      walletCreditAmount: quote.walletCredit,
      redirectUrl: `${origin}/admin/reward?deposit=success`,
    });

    await service
      .from('wallet_deposit_intents')
      .update({
        monnify_transaction_reference: result.transactionReference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', intent.id);

    return Response.json({
      ok: true,
      checkoutUrl: result.checkoutUrl,
      paymentReference: result.paymentReference,
      walletCredit: quote.walletCredit,
      processingFee: quote.processingFee,
      totalPayable: quote.totalPayable,
    });
  } catch (error) {
    console.error('Reward deposit: Monnify init failed', error?.message || error);
    await service
      .from('wallet_deposit_intents')
      .update({ status: 'failed', updated_at: new Date().toISOString() })
      .eq('id', intent.id)
      .eq('status', 'pending');
    return jsonError(error?.message || 'Failed to start Monnify deposit.', 502);
  }
}
