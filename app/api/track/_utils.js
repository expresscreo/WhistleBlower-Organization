import { pbkdf2, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { createClient } from '@supabase/supabase-js';
import { publicEnv, serverEnv } from '@/lib/env';
import {
  getBucketForStoragePath,
  PRIVATE_EVIDENCE_BUCKET,
  PUBLIC_MEDIA_BUCKET,
} from '@/lib/storageBuckets';

const pbkdf2Async = promisify(pbkdf2);
const MAX_MESSAGE_LENGTH = 5000;

let cachedServiceClient;

export function getServiceSupabase() {
  if (!serverEnv.supabaseServiceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  }

  if (!cachedServiceClient) {
    cachedServiceClient = createClient(
      publicEnv.supabaseUrl,
      serverEnv.supabaseServiceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }

  return cachedServiceClient;
}

export function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function normalizeIdentifier(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeMessage(value) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, MAX_MESSAGE_LENGTH);
}

export function normalizeEvidencePaths(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((path) => typeof path === 'string')
    .map((path) => path.trim())
    .filter(Boolean)
    .slice(0, 25);
}

export async function hashStoredPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password is required');
  }

  const saltBytes = randomBytes(16);
  const hashBytes = await pbkdf2Async(password, saltBytes, 100000, 32, 'sha256');

  return {
    hash: hashBytes.toString('base64'),
    salt: saltBytes.toString('base64'),
  };
}

export async function verifyStoredPassword(password, storedHash) {
  if (!password || !storedHash || typeof storedHash !== 'string') return false;

  const [hash, salt] = storedHash.split(':');
  if (!hash || !salt) return false;

  try {
    const computed = await pbkdf2Async(
      password,
      Buffer.from(salt, 'base64'),
      100000,
      32,
      'sha256',
    );
    const expected = Buffer.from(hash, 'base64');

    return (
      expected.length === computed.length &&
      timingSafeEqual(expected, computed)
    );
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
}

export function sanitizeReport(report) {
  if (!report) return null;
  const {
    anonymous_password_hash: _anonymousPasswordHash,
    anonymous_password_salt: _anonymousPasswordSalt,
    password_salt: _passwordSalt,
    ...safeReport
  } = report;
  return safeReport;
}

export function sanitizeBounty(bounty) {
  if (!bounty) return null;
  const {
    password: _password,
    password_salt: _passwordSalt,
    ...safeBounty
  } = bounty;
  return safeBounty;
}

export async function authenticateReport(reportId, password) {
  const normalizedReportId = normalizeIdentifier(reportId);
  if (!normalizedReportId) {
    return { error: 'Report ID is required.', status: 400 };
  }

  const supabase = getServiceSupabase();
  const { data: report, error } = await supabase
    .from('reports')
    .select('*')
    .eq('report_id', normalizedReportId)
    .single();

  if (error || !report) {
    return { error: 'Please check the Report ID and try again.', status: 404 };
  }

  if (!report.is_feedback) {
    const isValid = await verifyStoredPassword(
      password,
      report.anonymous_password_hash,
    );

    if (!isValid) {
      return { error: 'The password you entered is incorrect.', status: 401 };
    }
  }

  return { report, supabase };
}

export async function authenticateBounty(bountyId, password) {
  const normalizedBountyId = normalizeIdentifier(bountyId);
  if (!normalizedBountyId) {
    return { error: 'Bounty ID is required.', status: 400 };
  }

  const supabase = getServiceSupabase();
  const { data: bounty, error } = await supabase
    .from('bounties')
    .select('*')
    .eq('bounty_id', normalizedBountyId)
    .single();

  if (error || !bounty) {
    return { error: 'Please check the Bounty ID and try again.', status: 404 };
  }

  const isValid = await verifyStoredPassword(password, bounty.password);
  if (!isValid) {
    return { error: 'The password you entered is incorrect.', status: 401 };
  }

  return { bounty, supabase };
}

function normalizeStoragePath(filePath) {
  return String(filePath || '')
    .replace(/^\//, '')
    .replace(/^wb_evio\//, '');
}

function getReportEvidencePaths(report) {
  return Array.isArray(report?.evidence_path) ? report.evidence_path : [];
}

function getBountyEvidencePaths(bounty) {
  const evidence = bounty?.evidence;
  return Array.isArray(evidence) ? evidence : evidence ? [evidence] : [];
}

export function entityOwnsEvidencePath(entity, requestedPath, { field = 'report' } = {}) {
  const normalized = normalizeStoragePath(requestedPath);
  if (!normalized) return false;

  const paths =
    field === 'bounty'
      ? getBountyEvidencePaths(entity)
      : getReportEvidencePaths(entity);

  return paths.some((path) => normalizeStoragePath(path) === normalized);
}

export async function createSignedEvidenceUrl(supabase, storagePath) {
  const cleanPath = normalizeStoragePath(storagePath);
  if (!cleanPath) {
    return { error: 'Invalid file path.', status: 400 };
  }

  const primaryBucket = getBucketForStoragePath(cleanPath);
  const buckets =
    primaryBucket === PRIVATE_EVIDENCE_BUCKET
      ? [PRIVATE_EVIDENCE_BUCKET]
      : [PUBLIC_MEDIA_BUCKET, PRIVATE_EVIDENCE_BUCKET];

  for (const bucket of [...new Set(buckets)]) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(cleanPath, 3600);

    if (!error && data?.signedUrl) {
      return { signedUrl: data.signedUrl };
    }
  }

  return { error: 'Could not access this file.', status: 500 };
}
