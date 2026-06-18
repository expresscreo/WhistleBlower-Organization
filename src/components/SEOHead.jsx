'use client';

import { SITE_CONFIG } from '@/lib/seoUtils';
import { usePageHead } from '@/hooks/usePageHead';
const SEOHead = ({
  title,
  description,
  image,
  url,
  type = 'website',
  keywords,
  canonical,
  structuredData,
  noindex = false,
  nofollow = false,
}) => {
  const robotsContent = [];
  if (noindex) robotsContent.push('noindex');
  if (nofollow) robotsContent.push('nofollow');
  if (robotsContent.length === 0) robotsContent.push('index', 'follow');

  const toSafeString = (val, fallback = '') => {
    if (typeof val === 'symbol') return fallback;
    if (val === null || val === undefined) return fallback;
    if (typeof val === 'object') return fallback;
    return String(val);
  };

  const stripSymbols = (value) => {
    try {
      return JSON.parse(JSON.stringify(value, (key, v) => (typeof v === 'symbol' ? undefined : v)));
    } catch (_) {
      return null;
    }
  };

  const safeTitle = toSafeString(title, "WhistleBlower.ng - Nigeria's Premier Crime Reporting Platform");
  const safeDescription = toSafeString(
    description,
    'Report crimes anonymously, place bounties, and help build a safer Nigeria with WhistleBlower.ng.'
  );
  const safeImage = toSafeString(
    image,
    'https://whistleblower.ng/WBMedia/general/banner-WhistleBlower.jpeg'
  );
  const safeUrl = toSafeString(url, 'https://whistleblower.ng');
  const safeKeywords = toSafeString(keywords);

  const safeStructuredData =
    Array.isArray(structuredData) || (structuredData && typeof structuredData === 'object')
      ? stripSymbols(structuredData)
      : null;

  usePageHead({
    title: safeTitle,
    description: safeDescription,
    keywords: safeKeywords || undefined,
    robots: robotsContent.join(', '),
    canonical: canonical || safeUrl,
    ogTitle: safeTitle,
    ogDescription: safeDescription,
    ogImage: safeImage,
    ogUrl: safeUrl,
    ogType: type,
    ogSiteName: SITE_CONFIG.siteDisplayName,
    ogLocale: 'en_NG',
    twitterCard: 'summary_large_image',
    twitterSite: '@WhistleBlowerNG',
    twitterCreator: '@WhistleBlowerNG',
    twitterTitle: safeTitle,
    twitterDescription: safeDescription,
    twitterImage: safeImage,
    structuredData: safeStructuredData,
  });

  return null;
};

export default SEOHead;
