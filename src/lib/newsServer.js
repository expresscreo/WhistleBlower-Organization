import { findPublishedNewsByRouteSlug } from '@/lib/postSlug';
import { getServerSupabase } from '@/lib/serverSupabase';
import { getPublishedNewsPublicPath } from '@/lib/newsUrls';

const NEWS_SEO_COLUMNS =
  'id, title, content, category, status, featured_image, bounty_id, created_at, updated_at';

/**
 * Fetch a single published news row by route slug (for generateMetadata).
 */
export async function fetchPublishedNewsBySlug(routeSlug) {
  if (!routeSlug) return null;

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('news')
    .select(NEWS_SEO_COLUMNS)
    .eq('status', 'published');

  if (error) {
    console.error('[newsServer] fetchPublishedNewsBySlug:', error.message);
    return null;
  }

  return findPublishedNewsByRouteSlug(data || [], routeSlug);
}

/**
 * All published news rows for sitemaps and RSS (most recent first).
 */
export async function fetchPublishedNewsForSitemap() {
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from('news')
    .select(NEWS_SEO_COLUMNS)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[newsServer] fetchPublishedNewsForSitemap:', error.message);
    return [];
  }

  return (data || []).filter((row) => getPublishedNewsPublicPath(row));
}
