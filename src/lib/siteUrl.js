import { publicEnv } from '@/lib/env';

const DEFAULT_SITE_URL = 'https://whistleblower.ng';

/**
 * Canonical site origin for SEO, sitemaps, and structured data.
 */
export function resolveSiteUrl() {
  const raw = publicEnv.appUrl?.trim();
  if (!raw) return DEFAULT_SITE_URL;
  try {
    const url = new URL(raw);
    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export function absoluteUrl(path = '/') {
  const base = resolveSiteUrl();
  if (!path || path === '/') return `${base}/`;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
