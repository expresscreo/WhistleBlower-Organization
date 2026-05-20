/**
 * Client-safe environment variables (NEXT_PUBLIC_* only).
 */
const defaultSupabaseUrl = 'https://dvdhllhdbbybixwhtgnm.supabase.co';
const defaultSupabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2ZGhsbGhkYmJ5Yml4d2h0Z25tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3OTYzNDUsImV4cCI6MjA2ODM3MjM0NX0.ERqUze9EpJz30V1M7vtnyd750KzWBJod7fSguvFA40c';

export const publicEnv = {
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.VITE_SUPABASE_URL?.trim() ||
    defaultSupabaseUrl,
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
    defaultSupabaseAnonKey,
  paystackPublicKey:
    process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY?.trim() ||
    process.env.VITE_PAYSTACK_PUBLIC_KEY?.trim(),
  appUrl:
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VITE_APP_URL?.trim(),
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
