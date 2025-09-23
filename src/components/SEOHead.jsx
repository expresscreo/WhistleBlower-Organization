import React from 'react';
import { Helmet } from 'react-helmet';

/**
 * SEOHead Component
 * A reusable component for managing SEO metadata across all pages
 */
const SEOHead = ({
  title,
  description,
  image,
  url,
  type = 'website',
  keywords,
  canonical,
  article,
  structuredData,
  noindex = false,
  nofollow = false
}) => {
  // Generate robots meta content
  const robotsContent = [];
  if (noindex) robotsContent.push('noindex');
  if (nofollow) robotsContent.push('nofollow');
  if (robotsContent.length === 0) robotsContent.push('index', 'follow');

  // Ensure we have safe string values
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

  const safeTitle = toSafeString(title, 'WhistleBlower.ng - Nigeria\'s Premier Crime Reporting Platform');
  const safeDescription = toSafeString(description, 'Report crimes anonymously, place bounties, and help build a safer Nigeria with WhistleBlower.ng.');
  const safeImage = toSafeString(image, 'https://whistleblower.ng/WBMedia/general/banner-WhistleBlower.jpeg');
  const safeUrl = toSafeString(url, 'https://whistleblower.ng');
  const safeKeywords = toSafeString(keywords);

  const safeStructuredData = Array.isArray(structuredData) || (structuredData && typeof structuredData === 'object')
    ? stripSymbols(structuredData)
    : null;

  return (
    <Helmet>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} />
      {safeKeywords && <meta name="keywords" content={safeKeywords} />}
      <meta name="robots" content={robotsContent.join(', ')} />
      <link rel="canonical" href={canonical || safeUrl} />

      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:image" content={safeImage} />
      <meta property="og:url" content={safeUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="WhistleBlower.ng" />
      <meta property="og:locale" content="en_NG" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@WhistleBlowerNG" />
      <meta name="twitter:creator" content="@WhistleBlowerNG" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={safeImage} />

      {safeStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(safeStructuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
