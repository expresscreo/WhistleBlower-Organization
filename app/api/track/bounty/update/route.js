import {
  authenticateBounty,
  jsonError,
  normalizeEvidencePaths,
  normalizeMessage,
  readJson,
  sanitizeBounty,
} from '../../_utils';

export const runtime = 'nodejs';

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return jsonError('Invalid request body.');

  const message = normalizeMessage(body.message);
  const evidencePaths = normalizeEvidencePaths(body.evidencePaths);
  if (!message && evidencePaths.length === 0) {
    return jsonError('Please add a message or files.');
  }

  try {
    const auth = await authenticateBounty(body.bountyId, body.password);
    if (auth.error) return jsonError(auth.error, auth.status);

    const { bounty, supabase } = auth;
    const updateMessage = [
      message,
      evidencePaths.length > 0
        ? `Added ${evidencePaths.length} new file(s).`
        : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    const { error: updateError } = await supabase
      .from('bounty_updates')
      .insert({
        bounty_id: bounty.id,
        message: updateMessage,
        updated_by: null,
      });

    if (updateError) throw updateError;

    const updatedEvidence = [
      ...(Array.isArray(bounty.evidence) ? bounty.evidence : []),
      ...evidencePaths,
    ];

    const { data: updatedBounty, error: bountyError } = await supabase
      .from('bounties')
      .update({ evidence: updatedEvidence })
      .eq('id', bounty.id)
      .select()
      .single();

    if (bountyError) throw bountyError;

    return Response.json({ bounty: sanitizeBounty(updatedBounty) });
  } catch (error) {
    console.error('Bounty update failed:', error);
    return jsonError('Could not update your bounty.', 500);
  }
}
