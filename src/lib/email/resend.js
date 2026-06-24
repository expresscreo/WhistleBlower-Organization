import { Resend } from 'resend';
import { serverEnv } from '@/lib/env';
import { emailConfig } from './config';

let resendClient;

function getResend() {
  if (!serverEnv.resendApiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(serverEnv.resendApiKey);
  }
  return resendClient;
}

export function isEmailConfigured() {
  return Boolean(serverEnv.resendApiKey);
}

export async function sendEmail({ to, subject, html, replyTo }) {
  const resend = getResend();
  if (!resend) {
    console.warn('RESEND_API_KEY is not configured; skipping email:', subject);
    return { ok: false, skipped: true };
  }

  const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
  if (recipients.length === 0) {
    return { ok: false, skipped: true, reason: 'no_recipients' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: emailConfig.from,
      to: recipients,
      subject,
      html,
      reply_to: replyTo,
    });

    if (error) {
      console.error('Resend error:', error);
      return { ok: false, error };
    }

    return { ok: true, id: data?.id };
  } catch (error) {
    console.error('Email send failed:', error);
    return { ok: false, error };
  }
}
