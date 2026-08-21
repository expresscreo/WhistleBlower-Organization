import { getServiceSupabase } from '@/lib/serverSupabase';
import { adminReportUrl, emailConfig } from './config';
import { sendEmail } from './resend';
import {
  contactAutoReply,
  contactFormEmail,
  newReportEmail,
  reporterActivityEmail,
  rewardPaycodeExpiredEmail,
  rewardPaycodeGeneratedEmail,
  rewardPaycodeRedeemedEmail,
  rewardRequestEmail,
} from './templates';

const ORG_RECIPIENT_ROLES = [
  'organization_admin',
  'executive_admin',
  'staff',
  'customer_care',
];

const PLATFORM_RECIPIENT_ROLES = ['super_admin', 'executive_admin'];

async function getAppSettings(supabase) {
  const { data } = await supabase
    .from('app_settings')
    .select(
      'notification_new_report, notification_status_update, notification_new_message',
    )
    .limit(1)
    .maybeSingle();

  return {
    notification_new_report: data?.notification_new_report ?? true,
    notification_status_update: data?.notification_status_update ?? true,
    notification_new_message: data?.notification_new_message ?? true,
  };
}

async function getRecipientEmails(supabase, { organizationId }) {
  if (organizationId) {
    const { data } = await supabase
      .from('users')
      .select('email')
      .eq('organization_id', organizationId)
      .in('user_type', ORG_RECIPIENT_ROLES)
      .not('email', 'is', null);

    return [...new Set((data || []).map((user) => user.email).filter(Boolean))];
  }

  const { data } = await supabase
    .from('users')
    .select('email')
    .in('user_type', PLATFORM_RECIPIENT_ROLES)
    .not('email', 'is', null);

  return [...new Set((data || []).map((user) => user.email).filter(Boolean))];
}

// Paycode lifecycle events (generated / redeemed / expired) are strictly a
// WhistleBlower.ng (platform) concern — approval and issuance is a
// super-admin-only flow, so only super admins are notified, not
// organization staff or executive_admin.
async function getSuperAdminEmails(supabase) {
  const { data } = await supabase
    .from('users')
    .select('email')
    .eq('user_type', 'super_admin')
    .not('email', 'is', null);

  return [...new Set((data || []).map((user) => user.email).filter(Boolean))];
}

async function getReportByPublicId(supabase, reportId) {
  const { data, error } = await supabase
    .from('reports')
    .select(
      'id, report_id, title, category, organization_id, organization_name, status, created_at, organizations(name)',
    )
    .eq('report_id', reportId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getReportByUuid(supabase, reportUuid) {
  const { data, error } = await supabase
    .from('reports')
    .select(
      'id, report_id, title, category, organization_id, organization_name, status, reward_requested_amount, organizations(name)',
    )
    .eq('id', reportUuid)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const { data: secret, error: secretError } = await supabase
    .from('reward_paycode_secrets')
    .select('paycode')
    .eq('report_id', data.id)
    .maybeSingle();
  if (secretError) throw secretError;
  return { ...data, reward_paycode: secret?.paycode || null };
}

function organizationLabel(report) {
  return report.organizations?.name || report.organization_name || 'Unmatched';
}

export async function sendContactFormEmail({ name, email, subject, message }) {
  const inbound = contactFormEmail({ name, email, subject, message });
  const supportResult = await sendEmail({
    to: emailConfig.supportEmail,
    subject: inbound.subject,
    html: inbound.html,
    replyTo: email,
  });

  const autoReply = contactAutoReply({ name });
  await sendEmail({
    to: email,
    subject: autoReply.subject,
    html: autoReply.html,
  });

  return supportResult;
}

export async function notifyNewReport(reportId) {
  const supabase = getServiceSupabase();
  const settings = await getAppSettings(supabase);
  if (!settings.notification_new_report) {
    return { ok: false, skipped: true, reason: 'disabled' };
  }

  const report = await getReportByPublicId(supabase, reportId);
  if (!report) {
    return { ok: false, skipped: true, reason: 'report_not_found' };
  }

  const createdAt = new Date(report.created_at || 0);
  if (Date.now() - createdAt.getTime() > 10 * 60 * 1000) {
    return { ok: false, skipped: true, reason: 'report_too_old' };
  }

  const recipients = await getRecipientEmails(supabase, {
    organizationId: report.organization_id,
  });
  if (recipients.length === 0) {
    return { ok: false, skipped: true, reason: 'no_recipients' };
  }

  const template = newReportEmail({
    reportId: report.report_id,
    title: report.title,
    category: report.category,
    organizationName: organizationLabel(report),
    adminUrl: adminReportUrl(report.id),
  });

  return sendEmail({
    to: recipients,
    subject: template.subject,
    html: template.html,
  });
}

export async function notifyReporterActivity({ report, activity }) {
  const recipients = await getRecipientEmails(getServiceSupabase(), {
    organizationId: report.organization_id,
  });
  if (recipients.length === 0) {
    return { ok: false, skipped: true, reason: 'no_recipients' };
  }

  const template = reporterActivityEmail({
    reportId: report.report_id,
    activity,
    adminUrl: adminReportUrl(report.id),
  });

  return sendEmail({
    to: recipients,
    subject: template.subject,
    html: template.html,
  });
}

// Reporters never provide an email address (reports are tracked via report ID +
// password only, by design, to preserve anonymity), so there is no reporter
// inbox to notify here. These are kept as no-ops so existing call sites and
// the /api/notifications dispatcher continue to work unchanged.
export async function notifyStatusUpdate() {
  return { ok: false, skipped: true, reason: 'no_reporter_email' };
}

export async function notifyAdminMessage() {
  return { ok: false, skipped: true, reason: 'no_reporter_email' };
}

export async function notifyRewardRequest(reportUuid) {
  const supabase = getServiceSupabase();
  const report = await getReportByUuid(supabase, reportUuid);
  if (!report) {
    return { ok: false, skipped: true, reason: 'report_not_found' };
  }

  const recipients = await getRecipientEmails(supabase, {
    organizationId: null,
  });
  if (recipients.length === 0) {
    return { ok: false, skipped: true, reason: 'no_recipients' };
  }

  const template = rewardRequestEmail({
    reportId: report.report_id,
    amount: report.reward_requested_amount,
    organizationName: organizationLabel(report),
    adminUrl: adminReportUrl(report.id),
  });

  return sendEmail({
    to: recipients,
    subject: template.subject,
    html: template.html,
  });
}

// Reporters never provide an email address, so paycodes are only ever
// delivered via the Track Report page. Instead, WhistleBlower.ng super
// admins are notified at each stage of the paycode lifecycle below.

export async function notifyRewardPaycodeGenerated(reportUuid) {
  const supabase = getServiceSupabase();
  const report = await getReportByUuid(supabase, reportUuid);
  if (!report) {
    return { ok: false, skipped: true, reason: 'report_not_found' };
  }

  const recipients = await getSuperAdminEmails(supabase);
  if (recipients.length === 0) {
    return { ok: false, skipped: true, reason: 'no_recipients' };
  }

  const template = rewardPaycodeGeneratedEmail({
    reportId: report.report_id,
    paycode: report.reward_paycode,
    amount: report.reward_requested_amount,
    organizationName: organizationLabel(report),
    adminUrl: adminReportUrl(report.id),
  });

  return sendEmail({
    to: recipients,
    subject: template.subject,
    html: template.html,
  });
}

export async function notifyRewardPaycodeRedeemed(reportUuid) {
  const supabase = getServiceSupabase();
  const report = await getReportByUuid(supabase, reportUuid);
  if (!report) {
    return { ok: false, skipped: true, reason: 'report_not_found' };
  }

  const recipients = await getSuperAdminEmails(supabase);
  if (recipients.length === 0) {
    return { ok: false, skipped: true, reason: 'no_recipients' };
  }

  const template = rewardPaycodeRedeemedEmail({
    reportId: report.report_id,
    paycode: report.reward_paycode,
    amount: report.reward_requested_amount,
    organizationName: organizationLabel(report),
    adminUrl: adminReportUrl(report.id),
  });

  return sendEmail({
    to: recipients,
    subject: template.subject,
    html: template.html,
  });
}

export async function notifyRewardPaycodeExpired(reportUuid) {
  const supabase = getServiceSupabase();
  const report = await getReportByUuid(supabase, reportUuid);
  if (!report) {
    return { ok: false, skipped: true, reason: 'report_not_found' };
  }

  const recipients = await getSuperAdminEmails(supabase);
  if (recipients.length === 0) {
    return { ok: false, skipped: true, reason: 'no_recipients' };
  }

  const template = rewardPaycodeExpiredEmail({
    reportId: report.report_id,
    paycode: report.reward_paycode,
    amount: report.reward_requested_amount,
    organizationName: organizationLabel(report),
    adminUrl: adminReportUrl(report.id),
  });

  return sendEmail({
    to: recipients,
    subject: template.subject,
    html: template.html,
  });
}
