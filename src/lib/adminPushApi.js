import { supabase } from '@/lib/customSupabaseClient';

export async function notifyTrackingUpdatePush({ trackingType, trackingId }) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const response = await fetch('/api/admin/push/tracking', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ trackingType, trackingId }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'Could not send tracking push notification.');
  }

  return response.json();
}
