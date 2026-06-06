import { SITE_CONFIG } from '@/lib/seoUtils';

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toNewsPublicationDate(isoDate) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

/**
 * Build a Google News sitemap XML document.
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */
export function buildNewsSitemapXml(posts, { getPostUrl }) {
  const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const recentPosts = (posts || []).filter((post) => {
    const published = new Date(post.created_at).getTime();
    return !Number.isNaN(published) && published >= twoDaysAgo;
  });

  const sourcePosts = recentPosts.length > 0 ? recentPosts : (posts || []).slice(0, 100);

  const entries = sourcePosts
    .map((post) => {
      const loc = getPostUrl(post);
      if (!loc) return '';

      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE_CONFIG.name)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(toNewsPublicationDate(post.created_at))}</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>
    </news:news>
  </url>`;
    })
    .filter(Boolean)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries}
</urlset>`;
}

export const NEWS_SITEMAP_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
};
