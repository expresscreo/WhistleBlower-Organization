export function formatSupabaseError(error) {
  if (!error) return 'Unknown error';

  if (typeof error === 'string') return error;

  const message = error.message || error.error_description || error.msg;
  const details = error.details || error.hint;
  const code = error.code;

  const parts = [message, details, code ? `(${code})` : ''].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error';
  }
}
