import { notifyReporterActivity } from '@/lib/email/notifications';
import {
  authenticateReport,
  jsonError,
  normalizeMessage,
  readJson,
} from '../../_utils';

export const runtime = 'nodejs';

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return jsonError('Invalid request body.');

  const message = normalizeMessage(body.message);
  if (!message) return jsonError('Message is required.');

  try {
    const auth = await authenticateReport(body.reportId, body.password);
    if (auth.error) return jsonError(auth.error, auth.status);

    const { report, supabase } = auth;
    const insertPayload = {
      report_id: report.id,
      message,
      updated_by: null,
      is_read: false,
      is_read_by_admin: false,
      is_read_by_reporter: true,
    };

    if (body.replyToMessageId) {
      insertPayload.reply_to_message_id = body.replyToMessageId;
    }

    const { data, error } = await supabase
      .from('report_updates')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('reports')
      .update({ admin_has_viewed: false })
      .eq('id', report.id);

    notifyReporterActivity({
      report,
      activity: `New message from reporter:\n\n${message}`,
    }).catch((error) => {
      console.error('Reporter message notification failed:', error);
    });

    return Response.json({ update: data });
  } catch (error) {
    console.error('Reporter message failed:', error);
    return jsonError('Could not send your message.', 500);
  }
}
