import {
  authenticateBounty,
  jsonError,
  readJson,
  sanitizeBounty,
} from '../_utils';

export const runtime = 'nodejs';

export async function POST(request) {
  const body = await readJson(request);
  if (!body) return jsonError('Invalid request body.');

  try {
    const auth = await authenticateBounty(body.bountyId, body.password);
    if (auth.error) return jsonError(auth.error, auth.status);

    return Response.json({ bounty: sanitizeBounty(auth.bounty) });
  } catch (error) {
    console.error('Bounty tracking authentication failed:', error);
    return jsonError('Could not access this bounty.', 500);
  }
}
