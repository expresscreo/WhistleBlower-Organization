import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  resolveSupabaseAnonKey,
  resolveSupabaseUrl,
} from './src/lib/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  ...(isDev
    ? {
        experimental: {
          staleTimes: {
            dynamic: 0,
            static: 0,
          },
        },
      }
    : {}),
  async headers() {
    if (!isDev) return [];

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
    ];
  },
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
  webpack: (config, { dev }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
    };

    if (dev) {
      config.watchOptions = {
        poll: Number(process.env.WATCHPACK_POLLING_INTERVAL || 1000),
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**'],
      };
    }

    return config;
  },
};

export default nextConfig;
