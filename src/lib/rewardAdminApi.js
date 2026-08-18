import { supabase } from '@/lib/customSupabaseClient';

export async function generateRewardPaycode(reportId, amount) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const payload = { reportId };
  if (amount !== undefined && amount !== null && amount !== '') {
    payload.amount = Number(amount);
  }

  const response = await fetch('/api/admin/rewards/generate-paycode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Failed to generate Monnify paycode.');
  }

  return data;
}

export async function initializeRewardDeposit(amount) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const response = await fetch('/api/admin/rewards/deposit/initialize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ amount: Number(amount) }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Failed to start Monnify deposit.');
  }

  return data;
}

// Monnify has no expiry webhook, so this is called opportunistically when the
// Reward Management page loads to lazily mark any overdue pending paycodes
// as EXPIRED and notify super admins. Failures are non-fatal to page load.
export async function syncRewardPaycodeExpiry() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) return null;

  try {
    const response = await fetch('/api/admin/rewards/sync-paycode-expiry', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
