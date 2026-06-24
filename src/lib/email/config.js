import { publicEnv } from '@/lib/env';

const DEFAULT_FROM = 'WhistleBlower.ng <noreply@WhistleBlower.ng>';
const DEFAULT_SUPPORT = 'support@whistleblower.ng';

export const emailConfig = {
  from: process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM,
  supportEmail: process.env.NOTIFICATION_SUPPORT_EMAIL?.trim() || DEFAULT_SUPPORT,
  appUrl: publicEnv.appUrl?.replace(/\/$/, '') || 'https://whistleblower.ng',
};

export function reportTrackUrl(reportId) {
  return `${emailConfig.appUrl}/track-report?reportId=${encodeURIComponent(reportId)}`;
}

export function adminReportUrl(reportUuid) {
  return `${emailConfig.appUrl}/admin/reports/${reportUuid}`;
}
