import { jsonError, readJson } from '../track/_utils';
import {
  notifyAdminMessage,
  notifyNewReport,
  notifyRewardPaycode,
  notifyRewardRequest,
  notifyStatusUpdate,
} from '@/lib/email/notifications';
import {
  requireAuthenticatedAdmin,
  requireReportAccess,
} from '@/lib/email/auth';

export const runtime = 'nodejs';

export async function POST(request) {
  const body = await readJson(request);
  if (!body?.type) {
    return jsonError('Notification type is required.');
  }

  try {
    switch (body.type) {
      case 'new_report': {
        if (!body.reportId || typeof body.reportId !== 'string') {
          return jsonError('reportId is required.');
        }
        const result = await notifyNewReport(body.reportId.trim());
        return Response.json({ ok: true, result });
      }

      case 'status_update': {
        const auth = await requireAuthenticatedAdmin(request);
        if (auth.error) return auth.error;

        const reportUuid = body.reportUuid;
        const status = body.status;
        if (!reportUuid || !status) {
          return jsonError('reportUuid and status are required.');
        }

        const access = await requireReportAccess(auth.service, auth.profile, reportUuid);
        if (access.error) return access.error;

        const result = await notifyStatusUpdate(reportUuid, status);
        return Response.json({ ok: true, result });
      }

      case 'admin_message': {
        const auth = await requireAuthenticatedAdmin(request);
        if (auth.error) return auth.error;

        const reportUuid = body.reportUuid;
        const messagePreview = body.messagePreview;
        if (!reportUuid || !messagePreview) {
          return jsonError('reportUuid and messagePreview are required.');
        }

        const access = await requireReportAccess(auth.service, auth.profile, reportUuid);
        if (access.error) return access.error;

        const result = await notifyAdminMessage(reportUuid, messagePreview);
        return Response.json({ ok: true, result });
      }

      case 'reward_request': {
        const auth = await requireAuthenticatedAdmin(request);
        if (auth.error) return auth.error;

        const reportUuid = body.reportUuid;
        if (!reportUuid) {
          return jsonError('reportUuid is required.');
        }

        const access = await requireReportAccess(auth.service, auth.profile, reportUuid);
        if (access.error) return access.error;

        const result = await notifyRewardRequest(reportUuid);
        return Response.json({ ok: true, result });
      }

      case 'reward_paycode': {
        const auth = await requireAuthenticatedAdmin(request);
        if (auth.error) return auth.error;

        const reportUuid = body.reportUuid;
        const paycode = body.paycode;
        if (!reportUuid || !paycode) {
          return jsonError('reportUuid and paycode are required.');
        }

        const access = await requireReportAccess(auth.service, auth.profile, reportUuid);
        if (access.error) return access.error;

        const result = await notifyRewardPaycode(reportUuid, paycode);
        return Response.json({ ok: true, result });
      }

      default:
        return jsonError('Unsupported notification type.', 400);
    }
  } catch (error) {
    console.error('Notification dispatch failed:', error);
    return Response.json({
      ok: false,
      skipped: true,
      reason: 'dispatch_failed',
    });
  }
}
