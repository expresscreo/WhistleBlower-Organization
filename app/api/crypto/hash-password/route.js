import { hashStoredPassword, jsonError, readJson } from '../../track/_utils';

export const runtime = 'nodejs';

const MIN_PASSWORD_LENGTH = 1;
const MAX_PASSWORD_LENGTH = 256;

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return jsonError('Invalid request body.');

  const password = typeof body.password === 'string' ? body.password : '';
  if (password.length < MIN_PASSWORD_LENGTH) {
    return jsonError('Password is required.');
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return jsonError('Password is too long.');
  }

  try {
    const { hash, salt } = await hashStoredPassword(password);
    return Response.json({ hash, salt });
  } catch (error) {
    console.error('Server password hashing failed:', error);
    return jsonError('Failed to hash password.', 500);
  }
}
