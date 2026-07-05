import { createClient } from '@supabase/supabase-js';
import { publicEnv } from '@/lib/env';
import { getServiceSupabase, jsonError } from '../../track/_utils';

const ALLOWED_ADMIN_ROLES = new Set(['super_admin', 'executive_admin']);

const NEWS_WRITE_FIELDS = new Set([
  'title',
  'content',
  'category',
  'status',
  'featured_image',
  'bounty_id',
  'bounty_amount',
  'most_wanted_details',
  'published_evidence',
  'updated_at',
  'slug',
]);

export async function requireNewsAdmin(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { error: jsonError('Unauthorized. Sign in again and retry.', 401) };
  }

  const userClient = createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(token);

  if (userError || !user) {
    return { error: jsonError('Unauthorized. Sign in again and retry.', 401) };
  }

  const service = getServiceSupabase();
  const { data: profile, error: profileError } = await service
    .from('users')
    .select('user_type')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile || !ALLOWED_ADMIN_ROLES.has(profile.user_type)) {
    return { error: jsonError('You do not have permission to manage news posts.', 403) };
  }

  return { user, service };
}

export function pickNewsPayload(body) {
  if (!body || typeof body !== 'object') return null;

  const payload = {};
  for (const key of NEWS_WRITE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      payload[key] = body[key];
    }
  }
  return payload;
}

async function saveWithData(service, payload, id) {
  if (id) {
    return service.from('news').update(payload).eq('id', id).select('id').single();
  }
  return service.from('news').insert([payload]).select('id').single();
}

export async function persistNewsRecord(service, payload, id) {
  let currentPayload = { ...payload };
  let warnings = [];
  let result = await saveWithData(service, currentPayload, id);

  if (result.error && /slug/i.test(result.error.message || '')) {
    const { slug, ...withoutSlug } = currentPayload;
    currentPayload = withoutSlug;
    result = await saveWithData(service, currentPayload, id);
  }

  if (result.error && /published_evidence/i.test(result.error.message || '')) {
    const { published_evidence, ...withoutPublishedEvidence } = currentPayload;
    currentPayload = withoutPublishedEvidence;
    result = await saveWithData(service, currentPayload, id);
    if (!result.error) {
      warnings.push(
        'Evidence approvals were not saved. Add the published_evidence column to the news table.',
      );
    }
  }

  if (result.error && /most_wanted_details/i.test(result.error.message || '')) {
    const { most_wanted_details, ...withoutMostWanted } = currentPayload;
    currentPayload = withoutMostWanted;
    result = await saveWithData(service, currentPayload, id);
    if (!result.error) {
      warnings.push('Most Wanted details were not saved. Run the most_wanted_details migration.');
    }
  }

  if (result.error && /bounty_amount/i.test(result.error.message || '')) {
    const { bounty_amount, ...withoutBountyAmount } = currentPayload;
    currentPayload = withoutBountyAmount;
    result = await saveWithData(service, currentPayload, id);
    if (!result.error) {
      warnings.push('Bounty amount was not saved on the news record.');
    }
  }

  if (result.error && /updated_at/i.test(result.error.message || '')) {
    const { updated_at, ...withoutUpdatedAt } = currentPayload;
    currentPayload = withoutUpdatedAt;
    result = await saveWithData(service, currentPayload, id);
  }

  return { result, warnings };
}
