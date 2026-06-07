import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  resolveSupabaseAnonKey,
  resolveSupabaseUrl,
} from './src/lib/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/news/most_wanted',
        destination: '/most-wanted',
        permanent: true,
      },
      {
        source: '/news/news',
        destination: '/news/latest-news',
        permanent: true,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: resolveSupabaseUrl(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: resolveSupabaseAnonKey(),
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY:
      process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
      process.env.VITE_PAYSTACK_PUBLIC_KEY,
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || process.env.VITE_APP_URL,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };
    return config;
  },
};

export default nextConfig;
