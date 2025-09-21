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

  // Ensure we have fallback values
  const safeTitle = title || 'WhistleBlower.ng - Nigeria\'s Premier Crime Reporting Platform';
  const safeDescription = description || 'Report crimes anonymously, place bounties, and help build a safer Nigeria with WhistleBlower.ng.';
  const safeImage = image || 'https://dvdhllhdbbybixwhtgnm.supabase.co/storage/v1/object/public/whistleblower-files/banner%20WhistleBlower.jpeg';
  const safeUrl = url || 'https://whistleblower.ng';

  // Debug log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('SEOHead props:', { title: safeTitle, description: safeDescription, image: safeImage, url: safeUrl });
  }

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robotsContent.join(', ')} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical || safeUrl} />
      
      {/* Open Graph Meta Tags for Facebook, WhatsApp, etc. */}
      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:image" content={safeImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={safeTitle} />
      <meta property="og:url" content={safeUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="WhistleBlower.ng" />
      <meta property="og:locale" content="en_NG" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@WhistleBlowerNG" />
      <meta name="twitter:creator" content="@WhistleBlowerNG" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={safeImage} />
      <meta name="twitter:image:alt" content={safeTitle} />
      
      {/* Additional meta tags for better social media support */}
      <meta name="author" content="WhistleBlower.ng" />
      <meta name="theme-color" content="#ff5100" />
      
      {/* Article-specific meta tags */}
      {article && (
        <>
          <meta property="article:published_time" content={article.publishedTime} />
          {article.modifiedTime && <meta property="article:modified_time" content={article.modifiedTime} />}
          {article.section && <meta property="article:section" content={article.section} />}
          {article.tags && article.tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
