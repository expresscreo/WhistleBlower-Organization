import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateDepositQuote,
  calculateMonnifyProcessingFeeKobo,
  calculateRewardCharge,
} from './rewardFees.js';

test('grosses up a ₦5,000 deposit for fee and VAT', () => {
  assert.deepEqual(calculateDepositQuote(5000), {
    walletCredit: 5000,
    processingFee: 81.95,
    totalPayable: 5081.95,
    walletCreditKobo: 500000,
    processingFeeKobo: 8195,
    totalPayableKobo: 508195,
  });
});

test('uses the ₦2,000 base-fee cap plus VAT', () => {
  const quote = calculateDepositQuote(200000);
  assert.equal(quote.processingFee, 2150);
  assert.equal(quote.totalPayable, 202150);
  assert.equal(
    calculateMonnifyProcessingFeeKobo(quote.totalPayableKobo),
    215000,
  );
});

test('charges an uncapped 10% reward service fee', () => {
  assert.deepEqual(calculateRewardCharge(50000), {
    rewardAmount: 50000,
    serviceFee: 5000,
    totalDebit: 55000,
    rewardAmountKobo: 5000000,
    serviceFeeKobo: 500000,
    totalDebitKobo: 5500000,
    serviceFeeRate: 0.1,
  });
  assert.equal(calculateRewardCharge('50,000').totalDebit, 55000);
});

test('rounds all monetary results to whole kobo', () => {
  const deposit = calculateDepositQuote(123.456);
  const reward = calculateRewardCharge(99.99);
  assert.equal(Number.isInteger(deposit.totalPayableKobo), true);
  assert.equal(reward.serviceFee, 10);
  assert.equal(reward.totalDebit, 109.99);
});
