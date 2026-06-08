import { supabase } from '@/lib/customSupabaseClient';
import { formatSupabaseError } from '@/lib/supabaseErrors';

export async function saveNewsPost({ id, payload }) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const response = await fetch('/api/admin/news', {
    method: id ? 'PATCH' : 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(id ? { id, ...payload } : payload),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(data?.error || formatSupabaseError(data) || 'Failed to save news post.');
  }

  return data;
}
