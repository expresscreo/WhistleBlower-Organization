import { resolveSiteUrl } from '@/lib/siteUrl';
import { fetchPublishedNewsForSitemap } from '@/lib/newsServer';
import { getPublishedNewsPublicPath } from '@/lib/newsUrls';

const STATIC_ROUTES = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/about-us', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/how-we-secure-your-data', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/rewards-for-information', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/partner-program', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/pricing', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/submit-report', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/place-bounty', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/track', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/news', changeFrequency: 'hourly', priority: 0.9 },
  { path: '/news/latest-news', changeFrequency: 'hourly', priority: 0.85 },
  { path: '/news/bounty', changeFrequency: 'hourly', priority: 0.85 },
  { path: '/most-wanted', changeFrequency: 'hourly', priority: 0.85 },
  { path: '/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/terms-of-service', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/disclaimer', changeFrequency: 'yearly', priority: 0.3 },
];

export default async function sitemap() {
  const baseUrl = resolveSiteUrl();
  const now = new Date();

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  let newsEntries = [];
  try {
    const posts = await fetchPublishedNewsForSitemap();
    newsEntries = posts.map((post) => ({
      url: `${baseUrl}${getPublishedNewsPublicPath(post)}`,
      lastModified: new Date(post.updated_at || post.created_at),
      changeFrequency: 'daily',
      priority: post.category === 'news' ? 0.9 : 0.8,
    }));
  } catch (error) {
    console.error('[sitemap] Failed to fetch news:', error);
  }

  return [...staticEntries, ...newsEntries];
}
