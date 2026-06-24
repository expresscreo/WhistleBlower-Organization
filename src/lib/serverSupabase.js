import { createClient } from '@supabase/supabase-js';
import { publicEnv, serverEnv } from '@/lib/env';

let cachedClient;
let cachedServiceClient;

/**
 * Server-side Supabase client for public reads (sitemaps, generateMetadata).
 * Uses service role when available; falls back to anon key for published content.
 */
export function getServerSupabase() {
  if (cachedClient) return cachedClient;

  const key = serverEnv.supabaseServiceRoleKey || publicEnv.supabaseAnonKey;
  cachedClient = createClient(publicEnv.supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}

/** Service-role client for trusted server operations (email, tracking APIs). */
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
