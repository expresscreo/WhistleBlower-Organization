import { createClient } from '@supabase/supabase-js';
import { publicEnv } from '@/lib/env';
import { jsonError } from '@/lib/httpJson';
import { getServiceSupabase } from '@/lib/serverSupabase';

const ADMIN_ROLES = new Set([
  'super_admin',
  'executive_admin',
  'organization_admin',
  'staff',
  'customer_care',
]);

export async function requireAuthenticatedAdmin(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return { error: jsonError('Unauthorized.', 401) };
  }

  const userClient = createClient(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser(token);

  if (userError || !user) {
    return { error: jsonError('Unauthorized.', 401) };
  }

  const service = getServiceSupabase();
  const { data: profile, error: profileError } = await service
    .from('users')
    .select('id, user_type, organization_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile || !ADMIN_ROLES.has(profile.user_type)) {
    return { error: jsonError('You do not have permission to perform this action.', 403) };
  }

  return { user, profile, service };
}

export async function requireReportAccess(service, profile, reportUuid) {
  const { data: report, error } = await service
    .from('reports')
    .select('id, organization_id')
    .eq('id', reportUuid)
    .maybeSingle();

  if (error || !report) {
    return { error: jsonError('Report not found.', 404) };
  }

  const isPlatformAdmin =
    profile.user_type === 'super_admin' || profile.user_type === 'executive_admin';
  const isOrgMember =
    report.organization_id &&
    profile.organization_id === report.organization_id;

  if (!isPlatformAdmin && !isOrgMember) {
    return { error: jsonError('You do not have access to this report.', 403) };
  }

  return { report };
}
