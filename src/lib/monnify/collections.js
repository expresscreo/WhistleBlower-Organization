import { serverEnv } from '@/lib/env';
import { getMonnifyAccessToken, getMonnifyConfig } from './paycode';

const DEPOSIT_PREFIX = 'DEPOSIT-';
const PAID_STATUSES = new Set(['PAID', 'SUCCESS', 'SUCCESSFUL', 'COMPLETED']);

function monnifyErrorMessage(data, fallback) {
  return (
    data?.responseMessage ||
    data?.message ||
    data?.error ||
    fallback
  );
}

async function parseMonnifyJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function isDepositPaymentReference(reference) {
  return typeof reference === 'string' && reference.startsWith(DEPOSIT_PREFIX);
}

export function parseDepositOrganizationId(paymentReference, metadata) {
  const fromMeta =
    metadata?.organizationId ||
    metadata?.organization_id ||
    metadata?.ORGANIZATION_ID;
  if (typeof fromMeta === 'string' && fromMeta.trim()) {
    return fromMeta.trim();
  }

  const match = String(paymentReference || '').match(
    /^DEPOSIT-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-/i,
  );
  return match?.[1] || null;
}

export async function initializeDepositTransaction({
  amount,
  paymentReference,
  customerName,
  customerEmail,
  organizationId,
  redirectUrl,
}) {
  const contractCode = serverEnv.monnifyContractCode?.trim();
  if (!contractCode) {
    throw new Error('Monnify is not configured. Set MONNIFY_CONTRACT_CODE.');
  }
  if (!amount || Number(amount) <= 0) {
    throw new Error('Deposit amount must be greater than zero.');
  }
  if (!paymentReference || !customerEmail || !organizationId) {
    throw new Error('paymentReference, customerEmail, and organizationId are required.');
  }

  const { baseUrl } = getMonnifyConfig();
  const accessToken = await getMonnifyAccessToken();

  const payload = {
    amount: Number(amount),
    customerName: customerName || 'WhistleBlower Organization',
    customerEmail,
    paymentReference,
    paymentDescription: 'Reward wallet deposit',
    currencyCode: 'NGN',
    contractCode,
    redirectUrl,
    paymentMethods: ['CARD', 'ACCOUNT_TRANSFER'],
    metaData: { organizationId: String(organizationId) },
  };

  const response = await fetch(`${baseUrl}/api/v1/merchant/transactions/init-transaction`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await parseMonnifyJson(response);
  const body = data?.responseBody;
  const checkoutUrl = body?.checkoutUrl;

  if (!response.ok || !checkoutUrl) {
    throw new Error(
      monnifyErrorMessage(data, 'Failed to initialize Monnify deposit.'),
    );
  }

  return {
    checkoutUrl,
    transactionReference: body.transactionReference || null,
    paymentReference: body.paymentReference || paymentReference,
  };
}

export async function getTransactionStatus(transactionReference) {
  if (!transactionReference) {
    throw new Error('transactionReference is required.');
  }

  const { baseUrl } = getMonnifyConfig();
  const accessToken = await getMonnifyAccessToken();
  const encoded = encodeURIComponent(transactionReference);

  async function query(url) {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await parseMonnifyJson(response);
    return { response, data };
  }

  let { response, data } = await query(`${baseUrl}/api/v2/transactions/${encoded}`);
  if (!response.ok || !data?.responseBody) {
    ({ response, data } = await query(
      `${baseUrl}/api/v2/merchant/transactions/query?transactionReference=${encoded}`,
    ));
  }
  if (!response.ok || !data?.responseBody) {
    ({ response, data } = await query(
      `${baseUrl}/api/v2/merchant/transactions/query?paymentReference=${encoded}`,
    ));
  }

  const body = data?.responseBody;

  if (!response.ok || !body) {
    throw new Error(
      monnifyErrorMessage(data, 'Failed to query Monnify transaction status.'),
    );
  }

  const paymentStatus = String(body.paymentStatus || '').toUpperCase();
  return {
    paymentStatus,
    isPaid: PAID_STATUSES.has(paymentStatus),
    amountPaid: Number(body.amountPaid ?? body.amount ?? 0),
    paymentReference: body.paymentReference || null,
    transactionReference: body.transactionReference || transactionReference,
    metadata: body.metaData || body.metadata || {},
  };
}
