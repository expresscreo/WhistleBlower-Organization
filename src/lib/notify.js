import { supabase } from '@/lib/customSupabaseClient';

async function postNotification(payload) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = { 'Content-Type': 'application/json' };
  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  try {
    await fetch('/api/notifications', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn('Notification request failed:', error);
  }
}

export function notifyNewReport(reportId) {
  return postNotification({ type: 'new_report', reportId });
}

export function notifyStatusUpdate(reportUuid, status) {
  return postNotification({ type: 'status_update', reportUuid, status });
}

export function notifyAdminMessage(reportUuid, messagePreview) {
  return postNotification({ type: 'admin_message', reportUuid, messagePreview });
}

export function notifyRewardRequest(reportUuid) {
  return postNotification({ type: 'reward_request', reportUuid });
}

export function notifyRewardPaycode(reportUuid, paycode) {
  return postNotification({ type: 'reward_paycode', reportUuid, paycode });
}
