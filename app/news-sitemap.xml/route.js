import { fetchPublishedNewsForSitemap } from '@/lib/newsServer';
import { getPublishedNewsPublicUrl } from '@/lib/newsUrls';
import { buildNewsSitemapXml, NEWS_SITEMAP_HEADERS } from '@/lib/newsSitemapXml';

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const posts = await fetchPublishedNewsForSitemap();
    const xml = buildNewsSitemapXml(posts, { getPostUrl: getPublishedNewsPublicUrl });

    return new Response(xml, { headers: NEWS_SITEMAP_HEADERS });
  } catch (error) {
    console.error('[news-sitemap.xml] GET error:', error);
    const xml = buildNewsSitemapXml([], { getPostUrl: () => null });
    return new Response(xml, { status: 200, headers: NEWS_SITEMAP_HEADERS });
  }
}
