export function serializeRewardForRole(row, { isSuperAdmin, paycode = null }) {
  const safeReward = {
    ...row,
    has_paycode: Boolean(paycode),
  };
  delete safeReward.reward_paycode;
  delete safeReward.monnify_paycode_reference;
  delete safeReward.monnify_transaction_reference;

  if (isSuperAdmin) {
    safeReward.reward_paycode = paycode;
  }

  return safeReward;
}
