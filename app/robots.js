import { resolveSiteUrl } from '@/lib/siteUrl';

export default function robots() {
  const baseUrl = resolveSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/news/preview',
          '/login',
          '/register',
          '/payment-success',
        ],
      },
    ],
    sitemap: [`${baseUrl}/sitemap.xml`, `${baseUrl}/news-sitemap.xml`],
    host: baseUrl,
  };
}
