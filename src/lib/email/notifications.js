import { getServiceSupabase } from '@/lib/serverSupabase';
import {
  adminReportUrl,
  emailConfig,
  reportTrackUrl,
} from './config';
import { sendEmail } from './resend';
import {
  adminMessageEmail,
  contactAutoReply,
  contactFormEmail,
  newReportEmail,
  reporterActivityEmail,
  rewardPaycodeEmail,
  rewardRequestEmail,
  statusUpdateEmail,
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

async function getReportByPublicId(supabase, reportId) {
  const { data, error } = await supabase
    .from('reports')
    .select(
      'id, report_id, title, category, organization_id, organization_name, contact_email, status, created_at, submitted_at, organizations(name)',
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
      'id, report_id, title, category, organization_id, organization_name, contact_email, status, reward_requested_amount, organizations(name)',
    )
    .eq('id', reportUuid)
    .maybeSingle();

  if (error) throw error;
  return data;
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

  const createdAt = new Date(report.submitted_at || report.created_at || 0);
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

export async function notifyStatusUpdate(reportUuid, status) {
  const supabase = getServiceSupabase();
  const settings = await getAppSettings(supabase);
  if (!settings.notification_status_update) {
    return { ok: false, skipped: true, reason: 'disabled' };
  }

  const report = await getReportByUuid(supabase, reportUuid);
  if (!report?.contact_email) {
    return { ok: false, skipped: true, reason: 'no_reporter_email' };
  }

  const template = statusUpdateEmail({
    reportId: report.report_id,
    status,
    trackUrl: reportTrackUrl(report.report_id),
  });

  return sendEmail({
    to: report.contact_email,
    subject: template.subject,
    html: template.html,
  });
}

export async function notifyAdminMessage(reportUuid, messagePreview) {
  const supabase = getServiceSupabase();
  const settings = await getAppSettings(supabase);
  if (!settings.notification_new_message) {
    return { ok: false, skipped: true, reason: 'disabled' };
  }

  const report = await getReportByUuid(supabase, reportUuid);
  if (!report?.contact_email) {
    return { ok: false, skipped: true, reason: 'no_reporter_email' };
  }

  const template = adminMessageEmail({
    reportId: report.report_id,
    messagePreview,
    trackUrl: reportTrackUrl(report.report_id),
  });

  return sendEmail({
    to: report.contact_email,
    subject: template.subject,
    html: template.html,
  });
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

export async function notifyRewardPaycode(reportUuid, paycode) {
  const supabase = getServiceSupabase();
  const report = await getReportByUuid(supabase, reportUuid);
  if (!report?.contact_email) {
    return { ok: false, skipped: true, reason: 'no_reporter_email' };
  }

  const template = rewardPaycodeEmail({
    reportId: report.report_id,
    paycode,
    trackUrl: reportTrackUrl(report.report_id),
  });

  return sendEmail({
    to: report.contact_email,
    subject: template.subject,
    html: template.html,
  });
}
