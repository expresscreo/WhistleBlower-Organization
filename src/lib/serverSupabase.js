import { createClient } from '@supabase/supabase-js';
import { publicEnv, serverEnv } from '@/lib/env';

let cachedClient;

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
