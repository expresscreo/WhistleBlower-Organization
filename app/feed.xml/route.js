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

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * RSS 2.0 feed for news articles — used by Google News Publisher Center and aggregators.
 */
export async function GET() {
  const baseUrl = resolveSiteUrl();
  let posts = [];

  try {
    posts = await fetchPublishedNewsForSitemap();
  } catch (error) {
    console.error('[feed.xml] fetch error:', error);
  }

  const items = posts.slice(0, 50).map((post) => {
    const link = getPublishedNewsPublicUrl(post);
    const description = stripHtml(post.content).substring(0, 500);
    const pubDate = new Date(post.created_at).toUTCString();

    return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${escapeXml(pubDate)}</pubDate>
      <description>${escapeXml(description)}</description>
      <category>${escapeXml(post.category || 'news')}</category>
    </item>`;
  });

  const lastBuild = posts[0]
    ? new Date(posts[0].updated_at || posts[0].created_at).toUTCString()
    : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_CONFIG.name)} — News</title>
    <link>${escapeXml(`${baseUrl}/news`)}</link>
    <description>${escapeXml(SITE_CONFIG.description)}</description>
    <language>en-ng</language>
    <lastBuildDate>${escapeXml(lastBuild)}</lastBuildDate>
    <atom:link href="${escapeXml(`${baseUrl}/feed.xml`)}" rel="self" type="application/rss+xml"/>
${items.join('\n')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}
