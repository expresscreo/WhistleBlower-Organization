import assert from 'node:assert/strict';
import test from 'node:test';
import { serializeRewardForRole } from './rewardSerialization.js';

const reward = {
  id: 'report-1',
  report_id: 'WB123',
  reward_status: 'paid',
  reward_requested_amount: 50000,
  reward_service_fee_amount: 5000,
  reward_total_debit: 55000,
  reward_paycode: 'legacy-secret',
  monnify_paycode_reference: 'secret-reference',
};

test('organization reward responses never contain a cleartext paycode', () => {
  const result = serializeRewardForRole(reward, {
    isSuperAdmin: false,
    paycode: '12345678',
  });
  assert.equal(result.has_paycode, true);
  assert.equal('reward_paycode' in result, false);
  assert.equal('monnify_paycode_reference' in result, false);
  assert.equal(result.reward_total_debit, 55000);
});

test('super-admin reward responses include the cleartext paycode', () => {
  const result = serializeRewardForRole(reward, {
    isSuperAdmin: true,
    paycode: '12345678',
  });
  assert.equal(result.has_paycode, true);
  assert.equal(result.reward_paycode, '12345678');
});
