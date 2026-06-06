import { cache } from 'react';
import {
  generateSEOMeta,
  generateNewsPostSEO,
  generateBountyPostSEO,
  STRUCTURED_DATA_TEMPLATES,
  SITE_CONFIG,
} from '@/lib/seoUtils';
import { seoMetaToNextMetadata } from '@/lib/nextMetadata';
import { fetchPublishedNewsBySlug } from '@/lib/newsServer';
import { absoluteUrl } from '@/lib/siteUrl';

const NEWS_CATEGORY_SEO = {
  all: {
    title: 'News & Updates',
    description:
      'Stay updated with the latest news, published bounties, and most wanted alerts from across the nation.',
    path: '/news',
    keywords: ['news', 'updates', 'bounties', 'most wanted', 'Nigeria security'],
  },
  news: {
    title: 'Latest News',
    description:
      'Stay informed with the latest news and security updates from across Nigeria. Important information for citizen safety.',
    path: '/news/news',
    keywords: ['news', 'latest news', 'security updates', 'crime news', 'Nigeria news'],
  },
  bounty: {
    title: 'Active Bounties',
    description:
      'Browse active bounties and earn rewards for providing valuable information. Help solve cases and make Nigeria safer.',
    path: '/news/bounty',
    keywords: ['bounty', 'reward', 'active bounties', 'information bounty', 'Nigeria bounty'],
  },
  most_wanted: {
    title: 'Most Wanted',
    description:
      "View Nigeria's most wanted individuals and help law enforcement. Provide anonymous tips to bring fugitives to justice.",
    path: '/most-wanted',
    keywords: ['most wanted', 'fugitive', 'criminal', 'wanted person', 'law enforcement'],
  },
};

export function getNewsCategoryMetadata(category = 'all') {
  const config = NEWS_CATEGORY_SEO[category] || NEWS_CATEGORY_SEO.all;
  const seoMeta = generateSEOMeta({
    title: config.title,
    description: config.description,
    url: config.path,
    keywords: config.keywords,
  });

  return {
    metadata: seoMetaToNextMetadata(seoMeta),
    structuredData: [
      STRUCTURED_DATA_TEMPLATES.organization(),
      STRUCTURED_DATA_TEMPLATES.breadcrumbList([
        { name: 'Home', url: absoluteUrl('/') },
        { name: config.title, url: absoluteUrl(config.path) },
      ]),
    ],
  };
}

export const getNewsPostPageSeo = cache(async function getNewsPostPageSeo(slug) {
  const post = await fetchPublishedNewsBySlug(slug);

  if (!post) {
    return {
      metadata: {
        title: 'Article Not Found',
        robots: { index: false, follow: false },
      },
      structuredData: null,
    };
  }

  const seo = generateNewsPostSEO(post);
  return {
    metadata: seoMetaToNextMetadata(seo, { article: seo.article }),
    structuredData: seo.structuredData,
  };
});

export const getBountyPostPageSeo = cache(async function getBountyPostPageSeo(slug) {
  const post = await fetchPublishedNewsBySlug(slug);

  if (!post || post.category !== 'bounty') {
    return {
      metadata: {
        title: 'Bounty Not Found',
        robots: { index: false, follow: false },
      },
      structuredData: null,
    };
  }

  const seoMeta = generateBountyPostSEO(post);
  const structuredData = STRUCTURED_DATA_TEMPLATES.article({
    title: post.title,
    description: seoMeta.description,
    image: seoMeta.image,
    publishedDate: post.created_at,
    modifiedDate: post.updated_at,
    url: seoMeta.url,
  });

  return {
    metadata: seoMetaToNextMetadata(seoMeta, { article: seoMeta.article }),
    structuredData,
  };
});

export function getHomeStructuredData() {
  return [
    STRUCTURED_DATA_TEMPLATES.organization(),
    STRUCTURED_DATA_TEMPLATES.website(),
  ];
}

export function getFaqStructuredData(faqs) {
  return [
    STRUCTURED_DATA_TEMPLATES.organization(),
    STRUCTURED_DATA_TEMPLATES.faqPage(faqs),
  ];
}

export { SITE_CONFIG };
