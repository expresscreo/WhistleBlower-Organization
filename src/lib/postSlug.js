import { slugify } from '@/lib/utils';

/** Compare route slugs ignoring hyphens (handles 320000 vs 320-000). */
export const compactSlug = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

export const routeSlugMatchesTitle = (routeSlug, title) => {
  if (!routeSlug || !title) return false;
  return compactSlug(routeSlug) === compactSlug(slugify(title));
};

export const routeSlugMatchesNewsRow = (routeSlug, row) => {
  if (!routeSlug || !row) return false;
  if (row.slug && compactSlug(row.slug) === compactSlug(routeSlug)) return true;
  return routeSlugMatchesTitle(routeSlug, row.title);
};

/**
 * Find a published news row for a public /bounties/:slug or /news/post/:slug route.
 * Prefer the most recently updated row when several titles share the same slug shape.
 */
export const findPublishedNewsByRouteSlug = (newsList, routeSlug) => {
  if (!routeSlug || !Array.isArray(newsList)) return null;

  const sorted = [...newsList].sort(
    (a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0)
  );

  return sorted.find((row) => routeSlugMatchesNewsRow(routeSlug, row)) || null;
};
