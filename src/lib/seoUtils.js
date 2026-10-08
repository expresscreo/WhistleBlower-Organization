/**
 * SEO Utilities for WhistleBlower.ng
 * Provides consistent SEO metadata management across all pages
 */

import { resolveSiteUrl, absoluteUrl } from '@/lib/siteUrl';
import { getNewsPostPath, getNewsPostUrl, getBountyPostPath } from '@/lib/newsUrls';
import { resolvePostSocialShareImage } from '@/lib/ogImageUrl';
import {
  getMostWantedCardExcerpt,
  normalizeMostWantedDetails,
} from '@/lib/mostWantedUtils';
import { slugify } from '@/lib/utils';
import { MOST_WANTED_PATH } from '@/lib/newsCategoryPaths';

const siteUrl = () => resolveSiteUrl();

export const TITLE_SEPARATOR = ' — ';

// Default site configuration
export const SITE_CONFIG = {
  name: 'WhistleBlower.ng',
  /** Preferred label in Google Search results (site name above the URL). */
  siteDisplayName: 'WhistleBlower NG',
  get url() {
    return siteUrl();
  },
  get defaultImage() {
    return `${siteUrl()}/WBMedia/general/banner-WhistleBlower.jpeg`;
  },
  description:
    'WhistleBlower.ng is Nigeria’s digital trust and accountability platform for anonymous reporting, whistleblowing, rewards, bounty placement, crime intelligence, most wanted notices, customer feedback, workplace compliance, and public safety. Speak up safely, track cases securely, and help build a safer Nigeria.',
  twitterHandle: '@WhistleBlowerNG',
  locale: 'en_NG',
  type: 'website',
  publisherLogo: `${siteUrl()}/WBMedia/general/FAVICON-WhistleBlower.png`,
  keywords: [
    'whistleblower',
    'Nigeria',
    'crime reporting',
    'anonymous reporting',
    'bounty',
    'security',
    'transparency',
    'accountability',
  ],
};

export function formatPageTitle(title) {
  const base = typeof title === 'string' ? title : String(title || '');
  if (!base) return SITE_CONFIG.name;
  if (base.includes(SITE_CONFIG.name)) return base;
  return `${base}${TITLE_SEPARATOR}${SITE_CONFIG.name}`;
}

function applySocialImageToMeta(seoMeta, socialImage) {
  return {
    ...seoMeta,
    image: socialImage.url,
    imageType: socialImage.type,
    imageWidth: socialImage.width,
    imageHeight: socialImage.height,
    imageAlt: socialImage.alt,
  };
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Generate SEO metadata for a page
 */
export const generateSEOMeta = ({
  title,
  description,
  image = SITE_CONFIG.defaultImage,
  imageType = 'image/jpeg',
  imageWidth = 1200,
  imageHeight = 630,
  imageAlt,
  url,
  type = SITE_CONFIG.type,
  keywords = [],
  article = null,
  canonical = null,
  newsKeywords = null,
}) => {
  const fullTitle = formatPageTitle(title);
  const fullUrl = url ? absoluteUrl(url) : SITE_CONFIG.url;

  return {
    title: fullTitle,
    description,
    image,
    imageType,
    imageWidth,
    imageHeight,
    imageAlt: imageAlt || fullTitle,
    url: fullUrl,
    type,
    keywords:
      Array.isArray(keywords) && keywords.length > 0 ? keywords.join(', ') : undefined,
    canonical: canonical || fullUrl,
    article,
    newsKeywords,
  };
};

/**
 * Generate structured data for different page types
 */
export const generateStructuredData = (type, data) => ({
  '@context': 'https://schema.org',
  '@type': type,
  ...data,
});

/**
 * Common structured data templates
 */
export const STRUCTURED_DATA_TEMPLATES = {
  organization: () =>
    generateStructuredData('Organization', {
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      logo: SITE_CONFIG.defaultImage,
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@whistleblower.ng',
        telephone: '+2348053834017',
        contactType: 'Customer Support',
        availableLanguage: ['English'],
      },
      sameAs: [
        'https://twitter.com/WhistleBlowerNG',
        'https://facebook.com/WhistleBlowerNG',
      ],
    }),

  website: () =>
    generateStructuredData('WebSite', {
      name: SITE_CONFIG.siteDisplayName,
      alternateName: [SITE_CONFIG.name, 'whistleblower.ng'],
      url: SITE_CONFIG.url,
      description: SITE_CONFIG.description,
      inLanguage: 'en-NG',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${SITE_CONFIG.url}/news?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    }),

  breadcrumbList: (items) =>
    generateStructuredData('BreadcrumbList', {
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    }),

  article: (articleData) =>
    generateStructuredData('Article', {
      headline: articleData.title,
      description: articleData.description,
      image: articleData.image,
      author: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
        logo: {
          '@type': 'ImageObject',
          url: SITE_CONFIG.publisherLogo,
          width: 512,
          height: 512,
        },
      },
      datePublished: articleData.publishedDate,
      dateModified: articleData.modifiedDate || articleData.publishedDate,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': articleData.url,
      },
      isAccessibleForFree: true,
      inLanguage: 'en-NG',
    }),

  /**
   * NewsArticle schema — preferred for Google News and Top Stories eligibility.
   */
  newsArticle: (articleData) =>
    generateStructuredData('NewsArticle', {
      headline: articleData.title,
      description: articleData.description,
      image: Array.isArray(articleData.image)
        ? articleData.image
        : [articleData.image],
      author: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
      },
      publisher: {
        '@type': 'Organization',
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
        logo: {
          '@type': 'ImageObject',
          url: SITE_CONFIG.publisherLogo,
          width: 512,
          height: 512,
        },
      },
      datePublished: articleData.publishedDate,
      dateModified: articleData.modifiedDate || articleData.publishedDate,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': articleData.url,
      },
      articleSection: articleData.section,
      keywords: articleData.keywords,
      isAccessibleForFree: true,
      inLanguage: 'en-NG',
    }),

  faqPage: (faqs) =>
    generateStructuredData('FAQPage', {
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    }),
};

/**
 * Default SEO metadata for different page types
 */
export const DEFAULT_SEO_PAGES = {
  home: {
    title:
      'WhistleBlower.ng | Anonymous Reporting, Rewards, Bounties & Public Safety Platform',
    description:
      'WhistleBlower.ng is Nigeria’s digital trust and accountability platform for anonymous reporting, whistleblowing, rewards, bounty placement, crime intelligence, most wanted notices, customer feedback, workplace compliance, and public safety. Speak up safely, track cases securely, and help build a safer Nigeria.',
    keywords: [
      'whistleblower nigeria',
      'whistleblower ng',
      'anonymous reporting',
      'whistleblowing platform',
      'anonymous tip line',
      'report crime anonymously',
      'fraud reporting',
      'corruption reporting',
      'misconduct reporting',
      'workplace reporting',
      'customer feedback platform',
      'employee reporting system',
      'compliance software',
      'ethics hotline',
      'public safety platform',
      'crime reporting',
      'fake drug reporting',
      'reward system',
      'whistleblower rewards',
      'bounty placement',
      'wanted persons',
      'most wanted nigeria',
      'criminal intelligence',
      'public intelligence platform',
      'civic tech nigeria',
      'accountability platform',
      'governance technology',
      'integrity platform',
      'secure reporting',
      'anonymous complaints',
      'anti corruption platform',
      'public trust infrastructure',
      'security reporting',
      'community safety',
      'report anonymously and get rewarded',
    ],
  },

  about: {
    title: 'About Us - Building a Safer Nigeria',
    description:
      "Learn about WhistleBlower.ng's mission to empower Nigerian citizens with secure crime reporting and transparency. Join our movement for accountability.",
    keywords: [
      'about whistleblower',
      'Nigeria transparency',
      'crime reporting platform',
      'citizen empowerment',
      'accountability',
    ],
  },

  submitReport: {
    title: 'Submit a Crime Report - Anonymous & Secure',
    description:
      "Report crimes and misconduct anonymously through Nigeria's most secure platform. Your identity is protected while helping build a safer society.",
    keywords: [
      'submit report',
      'crime reporting',
      'anonymous report',
      'whistleblower',
      'Nigeria crime',
      'secure reporting',
    ],
  },

  placeBounty: {
    title: 'Place a Public Bounty - Get Information',
    description:
      'Place public bounties for specific information or missing persons. Reward citizens for providing valuable intelligence to help solve cases.',
    keywords: [
      'place bounty',
      'public bounty',
      'reward',
      'missing person',
      'information bounty',
      'Nigeria bounty',
    ],
  },

  trackReport: {
    title: 'Track Your Report Status',
    description:
      'Track the progress of your submitted reports in real-time. Monitor case updates and stay informed about the status of your submissions.',
    keywords: [
      'track report',
      'report status',
      'case tracking',
      'whistleblower tracking',
      'report progress',
    ],
  },

  news: {
    title: 'Latest News & Bounties - Stay Informed',
    description:
      'Stay updated with the latest news, active bounties, and most wanted alerts from across Nigeria. Your awareness helps build a safer community.',
    keywords: [
      'Nigeria news',
      'bounties',
      'most wanted',
      'crime alerts',
      'whistleblower news',
      'security updates',
    ],
  },

  pricing: {
    title: 'Pricing Plans - Affordable Security Solutions',
    description:
      'Choose from our flexible pricing plans for organizations. Get access to secure report management and transparency tools.',
    keywords: [
      'pricing',
      'plans',
      'organization subscription',
      'report management',
      'transparency tools',
      'affordable security',
    ],
  },

  faq: {
    title: 'Frequently Asked Questions',
    description:
      'Find answers to common questions about WhistleBlower.ng. Learn how to report crimes, place bounties, and use our platform securely.',
    keywords: ['FAQ', 'help', 'questions', 'whistleblower help', 'how to report', 'platform guide'],
  },

  contact: {
    title: 'Contact Us - Get Support',
    description:
      "Get in touch with WhistleBlower.ng support team. We're here to help with your reporting needs and platform questions.",
    keywords: [
      'contact',
      'support',
      'help',
      'customer service',
      'whistleblower support',
      'get help',
    ],
  },

  privacy: {
    title: 'Privacy Policy - Your Data is Protected',
    description:
      'Learn how WhistleBlower.ng protects your privacy and secures your data. We are committed to maintaining your anonymity and security.',
    keywords: ['privacy policy', 'data protection', 'anonymity', 'security', 'whistleblower privacy'],
  },

  terms: {
    title: 'Terms of Service - Platform Guidelines',
    description:
      "Read WhistleBlower.ng's terms of service and platform guidelines. Understand your rights and responsibilities when using our platform.",
    keywords: [
      'terms of service',
      'platform terms',
      'guidelines',
      'whistleblower terms',
      'user agreement',
    ],
  },

  disclaimer: {
    title: 'Disclaimer - Important Information',
    description:
      'Important disclaimer information about WhistleBlower.ng platform usage, limitations, and user responsibilities.',
    keywords: [
      'disclaimer',
      'platform disclaimer',
      'limitations',
      'user responsibility',
      'whistleblower disclaimer',
    ],
  },

  partner: {
    title: 'Partner Program - Join Our Network',
    description:
      "Join WhistleBlower.ng's partner network of organizations and government agencies. Enhance transparency and accountability in your operations.",
    keywords: [
      'partner program',
      'organization partnership',
      'government agencies',
      'transparency',
      'accountability',
      'partner network',
    ],
  },

  secureData: {
    title: 'How We Secure Your Data - Privacy & Security',
    description:
      "Learn about WhistleBlower.ng's advanced security measures and data protection protocols. Your anonymity and data security are our priority.",
    keywords: [
      'data security',
      'privacy protection',
      'encryption',
      'anonymity',
      'secure platform',
      'data protection',
    ],
  },

  rewards: {
    title: 'Rewards for Information - Earn for Helping',
    description:
      'Learn how WhistleBlower.ng rewards citizens who provide valuable information. Earn rewards securely while helping solve crimes.',
    keywords: [
      'rewards',
      'information reward',
      'bounty reward',
      'whistleblower reward',
      'Nigeria',
    ],
  },
};

function buildPostKeywords(post, extra = []) {
  const categoryKeywords = {
    bounty: ['bounty', 'reward', 'information', 'case', 'investigation'],
    most_wanted: ['most wanted', 'fugitive', 'criminal', 'wanted person', 'law enforcement'],
    news: ['news', 'update', 'security', 'crime', 'alert'],
  };

  return [
    ...SITE_CONFIG.keywords,
    ...(categoryKeywords[post.category] || []),
    ...extra,
    post.category,
  ];
}

function buildMostWantedDescription(post) {
  const details = normalizeMostWantedDetails(post.most_wanted_details);
  const summary = details.summary?.trim();
  if (summary) return summary.length > 160 ? `${summary.slice(0, 157)}...` : summary;

  const excerpt = getMostWantedCardExcerpt(post);
  if (excerpt) return excerpt;

  const plainContent = stripHtml(post.content);
  if (plainContent) return plainContent.substring(0, 160);

  const suspect = details.suspect_name?.trim();
  const crime = details.crime_type?.trim();
  if (suspect && crime) {
    return `${suspect} is wanted for ${crime.toLowerCase()} in Nigeria. View the alert and submit anonymous tips on WhistleBlower.ng.`;
  }

  return `Most wanted alert: ${post.title}. Help law enforcement with anonymous tips on WhistleBlower.ng.`;
}

/**
 * Generate SEO metadata for most wanted posts (X/Twitter, Google News, Open Graph).
 */
export const generateMostWantedPostSEO = (post) => {
  const title = post.title;
  const description = buildMostWantedDescription(post);
  const socialImage = resolvePostSocialShareImage(post);
  const postPath = getNewsPostPath(post) || `/news/post/${slugify(title)}`;
  const postUrl = getNewsPostUrl(post);
  const details = normalizeMostWantedDetails(post.most_wanted_details);

  const keywords = buildPostKeywords(post, [
    details.suspect_name,
    details.crime_type,
    details.crime_state,
    'anonymous tips',
  ].filter(Boolean));

  const seoMeta = applySocialImageToMeta(
    generateSEOMeta({
      title,
      description,
      url: postPath,
      type: 'article',
      keywords,
      newsKeywords: keywords.slice(0, 10).join(', '),
      article: {
        publishedTime: post.created_at,
        modifiedTime: post.updated_at || post.created_at,
        section: 'Most Wanted',
        tags: ['most wanted', 'whistleblower', 'Nigeria', details.crime_type].filter(Boolean),
      },
    }),
    socialImage
  );

  const articleData = {
    title,
    description,
    image: socialImage.url,
    publishedDate: post.created_at,
    modifiedDate: post.updated_at || post.created_at,
    url: postUrl,
    section: 'Most Wanted',
    keywords: keywords.join(', '),
  };

  return {
    ...seoMeta,
    structuredData: [
      STRUCTURED_DATA_TEMPLATES.newsArticle(articleData),
      STRUCTURED_DATA_TEMPLATES.breadcrumbList([
        { name: 'Home', url: SITE_CONFIG.url },
        { name: 'Most Wanted', url: absoluteUrl(MOST_WANTED_PATH) },
        { name: title, url: postUrl },
      ]),
    ],
  };
};

/**
 * Generate SEO metadata for news posts
 */
export const generateNewsPostSEO = (post) => {
  if (post?.category === 'most_wanted') {
    return generateMostWantedPostSEO(post);
  }

  const title = post.title;
  const plainContent = stripHtml(post.content);
  const description = plainContent
    ? plainContent.substring(0, 160)
    : `Read about ${post.title} on WhistleBlower.ng`;

  const socialImage = resolvePostSocialShareImage(post);
  const postPath = getNewsPostPath(post) || `/news/post/${slugify(title)}`;
  const postUrl = getNewsPostUrl(post);

  const sectionLabels = {
    bounty: 'Bounties',
    most_wanted: 'Most Wanted',
    news: 'News',
  };

  const keywords = buildPostKeywords(post);

  const seoMeta = applySocialImageToMeta(
    generateSEOMeta({
      title,
      description,
      url: postPath,
      type: 'article',
      keywords,
      newsKeywords: keywords.slice(0, 10).join(', '),
      article: {
        publishedTime: post.created_at,
        modifiedTime: post.updated_at || post.created_at,
        section: sectionLabels[post.category] || 'News',
        tags: [post.category, 'whistleblower', 'Nigeria'],
      },
    }),
    socialImage
  );

  const articleData = {
    title,
    description,
    image: socialImage.url,
    publishedDate: post.created_at,
    modifiedDate: post.updated_at || post.created_at,
    url: postUrl,
    section: sectionLabels[post.category] || 'News',
    keywords: keywords.join(', '),
  };

  return {
    ...seoMeta,
    structuredData: [
      STRUCTURED_DATA_TEMPLATES.newsArticle(articleData),
      STRUCTURED_DATA_TEMPLATES.breadcrumbList([
        { name: 'Home', url: SITE_CONFIG.url },
        { name: 'News', url: absoluteUrl('/news') },
        { name: title, url: postUrl },
      ]),
    ],
  };
};

/**
 * Generate SEO metadata for bounty posts
 */
export const generateBountyPostSEO = (post) => {
  const title = post.title;
  const plainContent = stripHtml(post.content);
  const description = plainContent
    ? plainContent.substring(0, 160)
    : `View bounty information for ${post.title} on WhistleBlower.ng`;

  const socialImage = resolvePostSocialShareImage(post);
  const bountyPath = getBountyPostPath(post) || `/bounties/${slugify(title)}`;

  return applySocialImageToMeta(
    generateSEOMeta({
    title: `Bounty: ${title}`,
    description,
    url: bountyPath,
    type: 'article',
    keywords: ['bounty', 'reward', 'information', 'Nigeria', 'whistleblower', post.category],
    article: {
      publishedTime: post.created_at,
      modifiedTime: post.updated_at || post.created_at,
      section: 'Bounty',
      tags: ['bounty', 'reward', post.category, 'whistleblower', 'Nigeria'],
    },
  }),
    socialImage
  );
};
