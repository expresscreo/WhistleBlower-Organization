import { serverEnv } from '@/lib/env';

const DEFAULT_BENEFICIARY_NAME = 'WhistleBlower Reward';
const PAYCODE_EXPIRY_DAYS = 7;

/** Format expiry for Monnify: `yyyy-MM-dd HH:mm:ss` */
export function formatMonnifyExpiryDate(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function defaultPaycodeExpiryDate() {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + PAYCODE_EXPIRY_DAYS);
  return expiry;
}

export function getMonnifyConfig() {
  const apiKey = serverEnv.monnifyApiKey?.trim();
  const secretKey = serverEnv.monnifySecretKey?.trim();
  const baseUrl = (serverEnv.monnifyBaseUrl || 'https://sandbox.monnify.com').replace(
    /\/$/,
    '',
  );

  if (!apiKey || !secretKey) {
    throw new Error('Monnify is not configured. Set MONNIFY_API_KEY and MONNIFY_SECRET_KEY.');
  }

  return { apiKey, secretKey, baseUrl };
}

function basicAuthHeader(apiKey, secretKey) {
  const token = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');
  return `Basic ${token}`;
}

async function parseMonnifyJson(response) {
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return data;
}

function monnifyErrorMessage(data, fallback) {
  return (
    data?.responseMessage ||
    data?.message ||
    data?.error ||
    fallback
  );
}

/**
 * Obtain a short-lived Monnify OAuth access token.
 * Never log credentials or tokens.
 */
export async function getMonnifyAccessToken() {
  const { apiKey, secretKey, baseUrl } = getMonnifyConfig();

  const response = await fetch(`${baseUrl}/api/v1/auth/login`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(apiKey, secretKey),
      'Content-Type': 'application/json',
    },
  });

  const data = await parseMonnifyJson(response);
  const accessToken = data?.responseBody?.accessToken;

  if (!response.ok || !accessToken) {
    throw new Error(
      monnifyErrorMessage(data, 'Failed to authenticate with Monnify.'),
    );
  }

  return accessToken;
}

function isExpiryLimitError(message) {
  return typeof message === 'string' && /system limit/i.test(message);
}

/**
 * Create a Monnify Paycode for offline cash withdrawal at Moniepoint POS.
 *
 * Monnify enforces an account-specific maximum expiry window (varies by
 * merchant/environment and is not documented). If our preferred expiry is
 * rejected with "... after system limit", we retry once without an
 * expiryDate so Monnify applies its own default (24 hours) instead of
 * failing the whole reward payout.
 *
 * @returns {{ paycode, paycodeReference, transactionReference, transactionStatus, expiryDate, amount, fee }}
 */
export async function createPaycode({
  amount,
  paycodeReference,
  beneficiaryName = DEFAULT_BENEFICIARY_NAME,
  expiryDate,
}) {
  if (!amount || Number(amount) <= 0) {
    throw new Error('Paycode amount must be greater than zero.');
  }
  if (!paycodeReference) {
    throw new Error('paycodeReference is required.');
  }

  const { baseUrl } = getMonnifyConfig();
  const accessToken = await getMonnifyAccessToken();

  const preferredExpiry =
    expiryDate instanceof Date
      ? formatMonnifyExpiryDate(expiryDate)
      : expiryDate || formatMonnifyExpiryDate(defaultPaycodeExpiryDate());

  async function callCreate(expiry) {
    const payload = {
      beneficiaryName,
      amount: Number(amount),
      paycodeReference,
    };
    if (expiry) payload.expiryDate = expiry;

    const response = await fetch(`${baseUrl}/api/v1/paycode`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await parseMonnifyJson(response);
    return { response, data };
  }

  let { response, data } = await callCreate(preferredExpiry);
  let usedExpiry = preferredExpiry;

  const succeeded = response.ok && data?.responseCode === 'M00' && data?.responseBody?.paycode;

  if (!succeeded && isExpiryLimitError(monnifyErrorMessage(data, ''))) {
    // Fall back to Monnify's own default expiry window (24h if unset).
    ({ response, data } = await callCreate(null));
    usedExpiry = null;
  }

  const body = data?.responseBody;

  if (!response.ok || data?.responseCode !== 'M00' || !body?.paycode) {
    // Log the raw response (no secrets) so a generic client-facing message
    // like "Unable to process request" can actually be diagnosed — this is
    // most often Monnify's Paycode/offline-payout feature not being
    // activated yet on the merchant account (contact integration-support@monnify.com).
    console.error('Monnify createPaycode raw response:', {
      httpStatus: response.status,
      responseCode: data?.responseCode,
      responseMessage: data?.responseMessage,
    });
    const message = monnifyErrorMessage(data, 'Failed to create Monnify paycode.');
    const error = new Error(
      data?.responseCode ? `${message} (Monnify code: ${data.responseCode})` : message,
    );
    error.monnifyResponseCode = data?.responseCode;
    throw error;
  }

  return {
    paycode: String(body.paycode),
    paycodeReference: body.paycodeReference || paycodeReference,
    transactionReference: body.transactionReference || null,
    transactionStatus: body.transactionStatus || 'PENDING',
    expiryDate: body.expiryDate || usedExpiry,
    amount: body.amount ?? Number(amount),
    fee: body.fee ?? null,
  };
}

/**
 * Cancel a previously created paycode (rollback after failed DB write).
 * Uses paycodeReference as returned by create.
 */
export async function cancelPaycode(paycodeReference) {
  if (!paycodeReference) {
    throw new Error('paycodeReference is required to cancel a paycode.');
  }

  const { baseUrl } = getMonnifyConfig();
  const accessToken = await getMonnifyAccessToken();
  const encoded = encodeURIComponent(paycodeReference);

  // Monnify documents cancel as a dedicated paycode management endpoint.
  const response = await fetch(`${baseUrl}/api/v1/paycode/${encoded}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await parseMonnifyJson(response);

  if (!response.ok && data?.responseCode !== 'M00') {
    throw new Error(
      monnifyErrorMessage(data, 'Failed to cancel Monnify paycode.'),
    );
  }

  return data?.responseBody ?? { cancelled: true };
}

export { DEFAULT_BENEFICIARY_NAME, PAYCODE_EXPIRY_DAYS };
