import {
  getServiceSupabase,
  jsonError,
  normalizeEvidencePaths,
  normalizeIdentifier,
  readJson,
} from '../track/_utils';

export const runtime = 'nodejs';

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return jsonError('Invalid request body.');

  const bountyId = normalizeIdentifier(body.bountyId);
  const title = normalizeIdentifier(body.title);
  const passwordHash = normalizeIdentifier(body.passwordHash);

  if (!bountyId || !title || !passwordHash) {
    return jsonError('Bounty ID, title, and password hash are required.');
  }

  try {
    const supabase = getServiceSupabase();
    const { data, error } = await supabase
      .from('bounties')
      .insert({
        bounty_id: bountyId,
        title,
        description: typeof body.description === 'string' ? body.description : '',
        type_of_crime: body.typeOfCrime || null,
        state: body.state || null,
        location: body.location || null,
        full_address: body.fullAddress || null,
        incident_date: body.incidentDate || null,
        bounty_amount: body.bountyAmount || null,
        password: passwordHash,
        status: 'pending_review',
        evidence: normalizeEvidencePaths(body.evidencePaths),
      })
      .select('bounty_id')
      .single();

    if (error) throw error;

    return Response.json({ bountyId: data.bounty_id });
  } catch (error) {
    console.error('Bounty creation failed:', error);
    return jsonError('Bounty submission failed. Please try again.', 500);
  }
}
