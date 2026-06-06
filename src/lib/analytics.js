/**
 * Routes where Google Analytics must not load or send page views.
 * News (/news, /news/post/..., /news/[category]) and other public pages are tracked.
 */
const ANALYTICS_EXCLUDED_PREFIXES = [
  '/submit-report',
  '/track',
  '/place-bounty',
  '/admin',
  '/login',
  '/register',
  '/payment-success',
];

export function isAnalyticsAllowedPath(pathname) {
  if (!pathname) return false;
  return !ANALYTICS_EXCLUDED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
