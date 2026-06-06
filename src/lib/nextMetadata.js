import {
  DEFAULT_SEO_PAGES,
  generateSEOMeta,
  SITE_CONFIG,
} from '@/lib/seoUtils';
import { resolveSiteUrl } from '@/lib/siteUrl';

function formatTitle(title) {
  const base = typeof title === 'string' ? title : String(title || '');
  return base.includes(SITE_CONFIG.name) ? base : `${base} - ${SITE_CONFIG.name}`;
}

/**
 * Convert seoUtils generateSEOMeta / generateNewsPostSEO output to Next.js Metadata.
 */
export function seoMetaToNextMetadata(seoMeta, options = {}) {
  const {
    robots,
    noindex = false,
    nofollow = false,
    article,
  } = options;

  const title = seoMeta?.title ? formatTitle(seoMeta.title) : SITE_CONFIG.name;
  const description = seoMeta?.description || SITE_CONFIG.description;
  const canonical = seoMeta?.canonical || seoMeta?.url || resolveSiteUrl();
  const image = seoMeta?.image || SITE_CONFIG.defaultImage;
  const ogType = seoMeta?.type || 'website';

  const metadata = {
    title,
    description,
    keywords: seoMeta?.keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: seoMeta?.url || canonical,
      siteName: SITE_CONFIG.name,
      images: [{ url: image, alt: title }],
      locale: SITE_CONFIG.locale.replace('_', '-'),
      type: ogType,
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE_CONFIG.twitterHandle,
      creator: SITE_CONFIG.twitterHandle,
      title,
      description,
      images: [image],
    },
    robots: robots ?? {
      index: !noindex,
      follow: !nofollow,
      googleBot: {
        index: !noindex,
        follow: !nofollow,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
  };

  const articleMeta = article || seoMeta?.article;
  if (articleMeta && ogType === 'article') {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'article',
      publishedTime: articleMeta.publishedTime,
      modifiedTime: articleMeta.modifiedTime,
      section: articleMeta.section,
      tags: articleMeta.tags,
    };
  }

  if (seoMeta?.newsKeywords) {
    metadata.other = {
      news_keywords: seoMeta.newsKeywords,
    };
  }

  return metadata;
}

export function buildStaticPageMetadata(pageKey, path, overrides = {}) {
  const pageSeo = DEFAULT_SEO_PAGES[pageKey];
  if (!pageSeo) {
    throw new Error(`Unknown SEO page key: ${pageKey}`);
  }

  const seoMeta = generateSEOMeta({
    title: overrides.title || pageSeo.title,
    description: overrides.description || pageSeo.description,
    url: path,
    keywords: overrides.keywords || pageSeo.keywords,
    image: overrides.image,
    type: overrides.type,
    canonical: overrides.canonical,
  });

  return seoMetaToNextMetadata(seoMeta, overrides.metadataOptions);
}
