import { createHmac, timingSafeEqual } from 'crypto';
import { serverEnv } from '@/lib/env';
import { notifyRewardPaycodeRedeemed } from '@/lib/email/notifications';
import { getServiceSupabase } from '@/lib/serverSupabase';
import { isDepositPaymentReference } from '@/lib/monnify/collections';
import { creditOrganizationDeposit } from '@/lib/monnify/creditDeposit';

export const runtime = 'nodejs';

const REDEEMED_STATUSES = new Set(['SUCCESS', 'SUCCESSFUL', 'PAID']);

function verifySignature(rawBody, signature) {
  const secretKey = serverEnv.monnifySecretKey;
  if (!signature || !secretKey) return false;

  const expected = createHmac('sha512', secretKey).update(rawBody).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const providedBuffer = Buffer.from(signature, 'utf8');

  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

function ack(extra = {}) {
  return Response.json({ received: true, ...extra });
}

async function handlePaycodeRedemption(eventData) {
  const paycodeReference = eventData?.paycodeReference || eventData?.product?.reference || null;
  const transactionReference = eventData?.transactionReference || null;
  const transactionStatus = String(
    eventData?.transactionStatus || eventData?.paymentStatus || '',
  ).toUpperCase();

  if (!paycodeReference && !transactionReference) {
    console.error('Monnify webhook: paycode event missing a reference to match');
    return;
  }

  if (!REDEEMED_STATUSES.has(transactionStatus)) {
    return;
  }

  const supabase = getServiceSupabase();
  const lookup = supabase
    .from('reports')
    .select('id')
    .eq('reward_paycode_status', 'PENDING');

  const { data: report, error } = paycodeReference
    ? await lookup.eq('monnify_paycode_reference', paycodeReference).maybeSingle()
    : await lookup.eq('monnify_transaction_reference', transactionReference).maybeSingle();

  if (error) {
    console.error('Monnify webhook: report lookup failed', error.message);
    return;
  }
  if (!report) return;

  const { data: updated, error: updateError } = await supabase
    .from('reports')
    .update({ reward_paycode_status: 'SUCCESS' })
    .eq('id', report.id)
    .eq('reward_paycode_status', 'PENDING')
    .select('id')
    .maybeSingle();

  if (updateError) {
    console.error('Monnify webhook: status update failed', updateError.message);
    return;
  }
  if (!updated) return;

  await notifyRewardPaycodeRedeemed(report.id);
}

export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get('monnify-signature');

  if (!verifySignature(rawBody, signature)) {
    console.error('Monnify webhook: invalid or missing signature');
    return ack({ verified: false });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error('Monnify webhook: invalid JSON payload');
    return ack({ parsed: false });
  }

  const eventType = payload?.eventType;
  const eventData = payload?.eventData || {};
  const paymentReference = eventData?.paymentReference || eventData?.product?.reference || null;
  const isPaycodeEvent =
    Boolean(eventData?.paycodeReference) ||
    eventData?.product?.type === 'PAYCODE' ||
    eventType === 'OFFLINE_PAYMENT_AGENT';

  try {
    if (eventType === 'SUCCESSFUL_TRANSACTION' && isDepositPaymentReference(paymentReference)) {
      await creditOrganizationDeposit({
        paymentReference,
        transactionReference: eventData?.transactionReference || null,
        metadata: eventData?.metaData || eventData?.metadata || {},
        amountHint: eventData?.amountPaid ?? eventData?.amount,
      });
      return ack({ type: 'deposit' });
    }

    if (isPaycodeEvent || (eventType === 'SUCCESSFUL_TRANSACTION' && eventData?.paycodeReference)) {
      await handlePaycodeRedemption(eventData);
      return ack({ type: 'paycode' });
    }
  } catch (error) {
    console.error('Monnify webhook: processing failed', error?.message || error);
  }

  return ack();
}
