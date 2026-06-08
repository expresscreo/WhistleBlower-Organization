import { unstable_cache } from 'next/cache';
import { findPublishedNewsByRouteSlug } from '@/lib/postSlug';
import { getServerSupabase } from '@/lib/serverSupabase';
import { getPublishedNewsPublicPath } from '@/lib/newsUrls';
import { resolveOgImageUrl } from '@/lib/ogImageUrl';

/** Lightweight fields for slug index — excludes heavy HTML content. */
const NEWS_INDEX_COLUMNS =
  'id, title, category, status, featured_image, bounty_id, created_at, updated_at';

const getPublishedNewsIndex = unstable_cache(
  async () => {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('news')
      .select(NEWS_INDEX_COLUMNS)
      .eq('status', 'published')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[newsServer] getPublishedNewsIndex:', error.message);
      return [];
    }

    return data || [];
  },
  ['published-news-index'],
  { revalidate: 60, tags: ['news'] }
);

const NEWS_SEO_DETAIL_COLUMNS =
  'id, title, content, category, status, featured_image, bounty_id, created_at, updated_at, most_wanted_details, published_evidence';

async function fetchNewsSeoRowById(id) {
  if (!id) return null;

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('news')
    .select(NEWS_SEO_DETAIL_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[newsServer] fetchNewsSeoRowById:', error.message);
    return null;
  }

  return data;
}

/**
 * Fetch a single published news row by route slug (for generateMetadata / OG tags).
 * Uses a cached index instead of loading every article body on each request.
 */
export async function fetchPublishedNewsBySlug(routeSlug) {
  if (!routeSlug) return null;

  const index = await getPublishedNewsIndex();
  const match = findPublishedNewsByRouteSlug(index, routeSlug);
  if (!match) return null;

  const row = await fetchNewsSeoRowById(match.id);
  return row || match;
}

export function serializeNewsRowsForClient(rows) {
  return (rows || []).map((row) => ({
    ...row,
    featured_image_url: row.featured_image ? resolveOgImageUrl(row.featured_image) : null,
  }));
}

/**
 * Published posts for a news listing category (server-rendered for crawlers).
 */
export async function fetchPublishedNewsByCategory(category = 'all', limit = 100) {
  const index = await getPublishedNewsIndex();
  let filtered = index;

  if (category && category !== 'all') {
    filtered = index.filter((row) => row.category === category);
  }

  const rows = filtered
    .filter((row) => getPublishedNewsPublicPath(row))
    .slice(0, limit);

  return serializeNewsRowsForClient(rows);
}

/**
 * Published news rows for sitemaps (no HTML bodies).
 */
export async function fetchPublishedNewsForSitemap() {
  const index = await getPublishedNewsIndex();
  return index.filter((row) => getPublishedNewsPublicPath(row));
}

/**
 * Recent published posts with content for RSS feeds.
 */
export async function fetchPublishedNewsForFeed(limit = 50) {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('news')
    .select(`${NEWS_INDEX_COLUMNS}, content`)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[newsServer] fetchPublishedNewsForFeed:', error.message);
    return [];
  }

  return (data || []).filter((row) => getPublishedNewsPublicPath(row));
}
