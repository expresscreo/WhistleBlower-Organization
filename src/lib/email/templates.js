import { emailConfig } from './config';

function layout({ title, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;">
        <tr><td style="padding:24px 28px;border-bottom:3px solid #e11d48;">
          <strong style="font-size:18px;">WhistleBlower.ng</strong>
        </td></tr>
        <tr><td style="padding:28px;line-height:1.6;font-size:15px;">${body}</td></tr>
        <tr><td style="padding:16px 28px;background:#fafafa;font-size:12px;color:#71717a;">
          This is an automated message from WhistleBlower.ng. Please do not reply unless instructed.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(href, label) {
  return `<p style="margin:24px 0;">
    <a href="${href}" style="display:inline-block;background:#e11d48;color:#ffffff;text-decoration:none;padding:12px 20px;font-weight:bold;">
      ${label}
    </a>
  </p>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function contactFormEmail({ name, email, subject, message }) {
  const body = `
    <p><strong>New contact form submission</strong></p>
    <p><strong>Name:</strong> ${escapeHtml(name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(email)}</p>
    <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
    <p><strong>Message:</strong></p>
    <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
  `;
  return {
    subject: `[Contact] ${subject}`,
    html: layout({ title: 'Contact form', body }),
  };
}

export function newReportEmail({ reportId, title, category, organizationName, adminUrl }) {
  const body = `
    <p>A new report has been submitted.</p>
    <p><strong>Report ID:</strong> ${escapeHtml(reportId)}</p>
    <p><strong>Title:</strong> ${escapeHtml(title || 'Untitled')}</p>
    <p><strong>Category:</strong> ${escapeHtml(category || 'N/A')}</p>
    <p><strong>Organization:</strong> ${escapeHtml(organizationName || 'Unmatched')}</p>
    ${button(adminUrl, 'View in dashboard')}
  `;
  return {
    subject: `New report submitted: ${reportId}`,
    html: layout({ title: 'New report', body }),
  };
}

export function reporterActivityEmail({ reportId, activity, adminUrl }) {
  const body = `
    <p>A reporter updated report <strong>${escapeHtml(reportId)}</strong>.</p>
    <p style="white-space:pre-wrap;">${escapeHtml(activity)}</p>
    ${button(adminUrl, 'View report')}
  `;
  return {
    subject: `Reporter update on ${reportId}`,
    html: layout({ title: 'Reporter update', body }),
  };
}

export function rewardRequestEmail({ reportId, amount, organizationName, adminUrl }) {
  const body = `
    <p>A reward has been requested for report <strong>${escapeHtml(reportId)}</strong>.</p>
    <p><strong>Organization:</strong> ${escapeHtml(organizationName || 'N/A')}</p>
    <p><strong>Amount:</strong> ₦${escapeHtml(amount)}</p>
    ${button(adminUrl, 'Review reward request')}
  `;
  return {
    subject: `Reward request for ${reportId}`,
    html: layout({ title: 'Reward request', body }),
  };
}

function formatNaira(amount) {
  const value = Number(amount);
  return Number.isFinite(value) ? `₦${value.toLocaleString()}` : '—';
}

/** Mask a paycode for email, e.g. 17607732 → xxxxx732 */
function maskPaycode(paycode) {
  const value = String(paycode || '').trim();
  if (!value) return '—';
  const visible = Math.min(3, value.length);
  return `${'x'.repeat(value.length - visible)}${value.slice(-visible)}`;
}

export function rewardPaycodeGeneratedEmail({ reportId, paycode, amount, organizationName, adminUrl }) {
  const body = `
    <p>A Monnify reward paycode has been generated for report <strong>${escapeHtml(reportId)}</strong>.</p>
    <p><strong>Organization:</strong> ${escapeHtml(organizationName || 'N/A')}</p>
    <p><strong>Amount:</strong> ${formatNaira(amount)}</p>
    <p><strong>Paycode:</strong> ${escapeHtml(maskPaycode(paycode))}</p>
    <p>The reporter can redeem this at any Moniepoint POS or agent until it expires.</p>
    ${button(adminUrl, 'View report')}
  `;
  return {
    subject: `Paycode generated for report ${reportId}`,
    html: layout({ title: 'Paycode generated', body }),
  };
}

export function rewardPaycodeRedeemedEmail({ reportId, paycode, amount, organizationName, adminUrl }) {
  const body = `
    <p>The reward paycode for report <strong>${escapeHtml(reportId)}</strong> has been redeemed at a Moniepoint agent.</p>
    <p><strong>Organization:</strong> ${escapeHtml(organizationName || 'N/A')}</p>
    <p><strong>Amount:</strong> ${formatNaira(amount)}</p>
    <p><strong>Paycode:</strong> ${escapeHtml(maskPaycode(paycode))}</p>
    ${button(adminUrl, 'View report')}
  `;
  return {
    subject: `Paycode redeemed for report ${reportId}`,
    html: layout({ title: 'Paycode redeemed', body }),
  };
}

export function rewardPaycodeExpiredEmail({ reportId, paycode, amount, organizationName, adminUrl }) {
  const body = `
    <p>The reward paycode for report <strong>${escapeHtml(reportId)}</strong> has expired unused.</p>
    <p><strong>Organization:</strong> ${escapeHtml(organizationName || 'N/A')}</p>
    <p><strong>Amount:</strong> ${formatNaira(amount)}</p>
    <p><strong>Paycode:</strong> ${escapeHtml(maskPaycode(paycode))}</p>
    <p>You may need to issue a new paycode for this reporter.</p>
    ${button(adminUrl, 'View report')}
  `;
  return {
    subject: `Paycode expired for report ${reportId}`,
    html: layout({ title: 'Paycode expired', body }),
  };
}

export function contactAutoReply({ name }) {
  const body = `
    <p>Hi ${escapeHtml(name)},</p>
    <p>Thank you for contacting WhistleBlower.ng. We received your message and will get back to you shortly.</p>
    <p>If your matter is urgent, you can also reach us at ${escapeHtml(emailConfig.supportEmail)}.</p>
  `;
  return {
    subject: 'We received your message',
    html: layout({ title: 'Message received', body }),
  };
}
