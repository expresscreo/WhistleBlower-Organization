/**
 * Client-safe environment variables (NEXT_PUBLIC_* only).
 */

const defaultSupabaseUrl = 'https://dvdhllhdbbybixwhtgnm.supabase.co';
const defaultSupabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2ZGhsbGhkYmJ5Yml4d2h0Z25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3OTYzNDUsImV4cCI6MjA2ODM3MjM0NX0.ERqUze9EpJz30V1M7vtnyd750KzWBJod7fSguvFA40c';

const PLACEHOLDER_SUPABASE_HOSTS = [
  'your-project.supabase.co',
  'xxx.supabase.co',
];

/** Values copied from env.example that must not be used in production. */
export function isPlaceholderSupabaseUrl(url) {
  if (!url?.trim()) return true;
  try {
    const host = new URL(url.trim()).hostname;
    return PLACEHOLDER_SUPABASE_HOSTS.some((h) => host === h);
  } catch {
    return true;
  }
}

export function isPlaceholderSupabaseAnonKey(key) {
  if (!key?.trim()) return true;
  const trimmed = key.trim();
  return (
    trimmed === 'eyJ...' ||
    trimmed === 'your-anon-key' ||
    trimmed.startsWith('your_') ||
    trimmed.length < 80
  );
}

function readEnv(...keys) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function resolveSupabaseUrl() {
  const fromEnv = readEnv('NEXT_PUBLIC_SUPABASE_URL', 'VITE_SUPABASE_URL');
  if (!fromEnv || isPlaceholderSupabaseUrl(fromEnv)) {
    return defaultSupabaseUrl;
  }
  return fromEnv;
}

export function resolveSupabaseAnonKey() {
  const fromEnv = readEnv(
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'VITE_SUPABASE_ANON_KEY',
  );
  if (!fromEnv || isPlaceholderSupabaseAnonKey(fromEnv)) {
    return defaultSupabaseAnonKey;
  }
  return fromEnv;
}

const defaultGaMeasurementId = 'G-THYVCE3LJQ';

export function resolveGaMeasurementId() {
  return readEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID') || defaultGaMeasurementId;
}

export function resolveGoogleSiteVerification() {
  return readEnv('GOOGLE_SITE_VERIFICATION', 'NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION');
}

export const publicEnv = {
  supabaseUrl: resolveSupabaseUrl(),
  supabaseAnonKey: resolveSupabaseAnonKey(),
  paystackPublicKey: readEnv(
    'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY',
    'VITE_PAYSTACK_PUBLIC_KEY',
  ),
  appUrl: readEnv('NEXT_PUBLIC_APP_URL', 'VITE_APP_URL'),
  gaMeasurementId: resolveGaMeasurementId(),
  googleSiteVerification: resolveGoogleSiteVerification(),
};

export function getPaystackPublicKey() {
  const key = publicEnv.paystackPublicKey;
  if (!key) return undefined;
  if (!key.startsWith('pk_')) {
    throw new Error('Paystack public key must start with pk_');
  }
  return key;
}

/**
 * Server-only secrets — import only in Server Components, Route Handlers, or middleware.
 */
export const serverEnv = {
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  paystackTestSecretKey: process.env.PAYSTACK_TEST_SECRET_KEY,
  paystackLiveSecretKey: process.env.PAYSTACK_LIVE_SECRET_KEY,
  resendApiKey: process.env.RESEND_API_KEY,
};
