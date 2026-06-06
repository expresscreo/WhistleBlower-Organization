import {
  authenticateBounty,
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
    const auth = await authenticateBounty(body.bountyId, body.password);
    if (auth.error) return jsonError(auth.error, auth.status);

    const { bounty, supabase } = auth;
    const insertPayload = {
      bounty_id: bounty.id,
      message,
      updated_by: null,
      is_read_by_placer: true,
      is_read_by_admin: false,
    };

    if (body.replyToMessageId) {
      insertPayload.reply_to_message_id = body.replyToMessageId;
    }

    const { data, error } = await supabase
      .from('bounty_updates')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('bounties')
      .update({ admin_has_viewed: false })
      .eq('id', bounty.id);

    return Response.json({ update: data });
  } catch (error) {
    console.error('Bounty placer message failed:', error);
    return jsonError('Could not send your message.', 500);
  }
}
