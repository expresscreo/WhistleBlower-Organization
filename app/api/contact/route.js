import { jsonError, readJson } from '../track/_utils';
import { sendContactFormEmail } from '@/lib/email/notifications';

export const runtime = 'nodejs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return jsonError('Invalid request body.');

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const honeypot = typeof body.honeypot === 'string' ? body.honeypot.trim() : '';

  if (honeypot) {
    return Response.json({ ok: true });
  }

  if (!name || !email || !subject || !message) {
    return jsonError('Please fill out all required fields.');
  }

  if (!EMAIL_PATTERN.test(email)) {
    return jsonError('Please enter a valid email address.');
  }

  try {
    const result = await sendContactFormEmail({ name, email, subject, message });
    if (!result.ok && !result.skipped) {
      return jsonError('Could not send your message. Please try again later.', 500);
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error('Contact form email failed:', error);
    return jsonError('Could not send your message. Please try again later.', 500);
  }
}
