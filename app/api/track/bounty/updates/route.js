import {
  authenticateBounty,
  jsonError,
  readJson,
} from '../../_utils';

export const runtime = 'nodejs';

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return jsonError('Invalid request body.');

  try {
    const auth = await authenticateBounty(body.bountyId, body.password);
    if (auth.error) return jsonError(auth.error, auth.status);

    const { bounty, supabase } = auth;
    const { data, error } = await supabase
      .from('bounty_updates')
      .select('*')
      .eq('bounty_id', bounty.id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return Response.json({ updates: data || [] });
  } catch (error) {
    console.error('Bounty updates fetch failed:', error);
    return jsonError('Could not load bounty updates.', 500);
  }
}
