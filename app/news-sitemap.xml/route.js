import { fetchPublishedNewsForSitemap } from '@/lib/newsServer';
import { getPublishedNewsPublicUrl } from '@/lib/newsUrls';
import { SITE_CONFIG } from '@/lib/seoUtils';
import { resolveSiteUrl } from '@/lib/siteUrl';

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
 * Google News sitemap (last 2 days of articles per Google guidelines;
 * we include all published articles and let Google filter).
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
 */
export async function GET() {
  const baseUrl = resolveSiteUrl();
  let posts = [];

  try {
    posts = await fetchPublishedNewsForSitemap();
  } catch (error) {
    console.error('[news-sitemap] fetch error:', error);
  }

  const twoDaysAgo = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const recentPosts = posts.filter((post) => {
    const published = new Date(post.created_at).getTime();
    return !Number.isNaN(published) && published >= twoDaysAgo;
  });

  const entries = (recentPosts.length > 0 ? recentPosts : posts.slice(0, 100))
    .map((post) => {
      const loc = getPublishedNewsPublicUrl(post);
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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}
