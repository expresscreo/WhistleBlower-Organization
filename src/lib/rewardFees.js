import { parseFormattedNumber } from './utils.js';

export const DEFAULT_MONNIFY_FEE_RATE = 0.015;
export const DEFAULT_MONNIFY_FEE_VAT_RATE = 0.075;
export const DEFAULT_MONNIFY_FEE_CAP_NAIRA = 2000;
export const REWARD_SERVICE_FEE_RATE = 0.1;

function requirePositiveFinite(value, label) {
  const number = parseFormattedNumber(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`${label} must be greater than zero.`);
  }
  return number;
}

export function nairaToKobo(value) {
  return Math.round(requirePositiveFinite(value, 'Amount') * 100);
}

export function koboToNaira(value) {
  return Number((Number(value) / 100).toFixed(2));
}

export function calculateMonnifyProcessingFeeKobo(
  grossKobo,
  {
    feeRate = DEFAULT_MONNIFY_FEE_RATE,
    vatRate = DEFAULT_MONNIFY_FEE_VAT_RATE,
    feeCapNaira = DEFAULT_MONNIFY_FEE_CAP_NAIRA,
  } = {},
) {
  const normalizedGross = Math.max(0, Math.round(Number(grossKobo) || 0));
  const normalizedRate = Math.max(0, Number(feeRate) || 0);
  const normalizedVatRate = Math.max(0, Number(vatRate) || 0);
  const capKobo = Math.max(0, Math.round(Number(feeCapNaira) * 100));
  const baseFeeKobo = Math.min(
    Math.round(normalizedGross * normalizedRate),
    capKobo,
  );
  return Math.round(baseFeeKobo * (1 + normalizedVatRate));
}

export function calculateDepositQuote(amount, config = {}) {
  const walletCreditKobo = nairaToKobo(amount);

  // Find the lowest whole-kobo checkout amount whose post-fee settlement
  // covers the requested wallet credit. This handles both percentage and
  // capped Monnify fees without fragile closed-form rounding.
  let low = walletCreditKobo;
  let high =
    walletCreditKobo +
    calculateMonnifyProcessingFeeKobo(walletCreditKobo, config) +
    Math.round((Number(config.feeCapNaira) || DEFAULT_MONNIFY_FEE_CAP_NAIRA) * 100) +
    100;

  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    const feeKobo = calculateMonnifyProcessingFeeKobo(middle, config);
    if (middle - feeKobo >= walletCreditKobo) {
      high = middle;
    } else {
      low = middle + 1;
    }
  }

  const grossKobo = low;
  const processingFeeKobo = grossKobo - walletCreditKobo;
  return {
    walletCredit: koboToNaira(walletCreditKobo),
    processingFee: koboToNaira(processingFeeKobo),
    totalPayable: koboToNaira(grossKobo),
    walletCreditKobo,
    processingFeeKobo,
    totalPayableKobo: grossKobo,
  };
}

export function calculateRewardCharge(amount) {
  const rewardAmountKobo = nairaToKobo(amount);
  const serviceFeeKobo = Math.round(rewardAmountKobo * REWARD_SERVICE_FEE_RATE);
  const totalDebitKobo = rewardAmountKobo + serviceFeeKobo;
  return {
    rewardAmount: koboToNaira(rewardAmountKobo),
    serviceFee: koboToNaira(serviceFeeKobo),
    totalDebit: koboToNaira(totalDebitKobo),
    rewardAmountKobo,
    serviceFeeKobo,
    totalDebitKobo,
    serviceFeeRate: REWARD_SERVICE_FEE_RATE,
  };
}
