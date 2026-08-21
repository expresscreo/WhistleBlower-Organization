import { supabase } from '@/lib/customSupabaseClient';

async function getAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session?.access_token) {
    throw new Error('Your session has expired. Please sign in again.');
  }
  return session.access_token;
}

export async function fetchRewardManagementData() {
  const accessToken = await getAccessToken();
  const response = await fetch('/api/admin/rewards', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || 'Could not load rewards.');
  }
  return data;
}

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

export async function requestOrganizationReward(reportId, amount) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const response = await fetch('/api/admin/rewards/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ reportId, amount: Number(amount) }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || 'Failed to submit reward request.');
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
