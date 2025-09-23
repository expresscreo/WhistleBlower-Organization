/**
 * SEO Utilities for WhistleBlower.ng
 * Provides consistent SEO metadata management across all pages
 */

// Default site configuration
export const SITE_CONFIG = {
  name: 'WhistleBlower.ng',
  url: 'https://whistleblower.ng',
  defaultImage: 'https://whistleblower.ng/WBMedia/general/banner-WhistleBlower.jpeg',
  description: 'Nigeria\'s premier platform for secure crime reporting and public bounties. Report crimes anonymously, place bounties, and help build a safer Nigeria.',
  twitterHandle: '@WhistleBlowerNG',
  locale: 'en_NG',
  type: 'website',
  keywords: ['whistleblower', 'Nigeria', 'crime reporting', 'anonymous reporting', 'bounty', 'security', 'transparency', 'accountability']
};

/**
 * Generate SEO metadata for a page
 * @param {Object} options - SEO configuration options
 * @param {string} options.title - Page title
 * @param {string} options.description - Page description
 * @param {string} options.image - Page image URL (optional)
 * @param {string} options.url - Page URL (optional)
 * @param {string} options.type - Open Graph type (default: 'website')
 * @param {Array} options.keywords - Meta keywords (optional)
 * @param {Object} options.article - Article-specific data (optional)
 * @param {string} options.canonical - Canonical URL (optional)
 * @returns {Object} SEO metadata object
 */
export const generateSEOMeta = ({
  title,
  description,
  image = SITE_CONFIG.defaultImage,
  url,
  type = SITE_CONFIG.type,
  keywords = [],
  article = null,
  canonical = null
}) => {
  const baseTitle = typeof title === 'string' ? title : String(title || '');
  const fullTitle = baseTitle.includes(SITE_CONFIG.name) ? baseTitle : `${baseTitle} - ${SITE_CONFIG.name}`;
  const fullUrl = url ? `${SITE_CONFIG.url}${url}` : SITE_CONFIG.url;
  const img = typeof image === 'string' ? image : String(image || '');
  const fullImage = img && img.startsWith('http') ? img : img ? `${SITE_CONFIG.url}${img}` : SITE_CONFIG.defaultImage;
  
  const meta = {
    title: fullTitle,
    description,
    image: fullImage,
    url: fullUrl,
    type,
    keywords: Array.isArray(keywords) && keywords.length > 0 ? keywords.join(', ') : undefined,
    canonical: canonical || fullUrl,
    article
  };

  return meta;
};

/**
 * Generate structured data for different page types
 * @param {string} type - Type of structured data
 * @param {Object} data - Data for structured data
 * @returns {Object} Structured data object
 */
export const generateStructuredData = (type, data) => {
  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data
  };

  return baseStructuredData;
};

/**
 * Common structured data templates
 */
export const STRUCTURED_DATA_TEMPLATES = {
  organization: () => generateStructuredData('Organization', {
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: SITE_CONFIG.defaultImage,
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@whistleblower.ng',
      contactType: 'Customer Support',
      availableLanguage: ['English']
    },
    sameAs: [
      'https://twitter.com/WhistleBlowerNG',
      'https://facebook.com/WhistleBlowerNG'
    ]
  }),

  website: () => generateStructuredData('WebSite', {
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }),

  breadcrumbList: (items) => generateStructuredData('BreadcrumbList', {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }),

  article: (articleData) => generateStructuredData('Article', {
    headline: articleData.title,
    description: articleData.description,
    image: articleData.image,
    author: {
      '@type': 'Organization',
      name: SITE_CONFIG.name
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: SITE_CONFIG.defaultImage
      }
    },
    datePublished: articleData.publishedDate,
    dateModified: articleData.modifiedDate || articleData.publishedDate,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleData.url
    }
  }),

  faqPage: (faqs) => generateStructuredData('FAQPage', {
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  })
};

/**
 * Default SEO metadata for different page types
 */
export const DEFAULT_SEO_PAGES = {
  home: {
    title: 'Report Crime Securely, Earn Rewards',
    description: 'Nigeria\'s premier platform for anonymous crime reporting and public bounties. Submit reports securely, place bounties, and help build a safer Nigeria.',
    keywords: ['crime reporting', 'anonymous reporting', 'whistleblower', 'Nigeria', 'bounty', 'security', 'transparency']
  },

  about: {
    title: 'About Us - Building a Safer Nigeria',
    description: 'Learn about WhistleBlower.ng\'s mission to empower Nigerian citizens with secure crime reporting and transparency. Join our movement for accountability.',
    keywords: ['about whistleblower', 'Nigeria transparency', 'crime reporting platform', 'citizen empowerment', 'accountability']
  },

  submitReport: {
    title: 'Submit a Crime Report - Anonymous & Secure',
    description: 'Report crimes and misconduct anonymously through Nigeria\'s most secure platform. Your identity is protected while helping build a safer society.',
    keywords: ['submit report', 'crime reporting', 'anonymous report', 'whistleblower', 'Nigeria crime', 'secure reporting']
  },

  placeBounty: {
    title: 'Place a Public Bounty - Get Information',
    description: 'Place public bounties for specific information or missing persons. Reward citizens for providing valuable intelligence to help solve cases.',
    keywords: ['place bounty', 'public bounty', 'reward', 'missing person', 'information bounty', 'Nigeria bounty']
  },

  trackReport: {
    title: 'Track Your Report Status',
    description: 'Track the progress of your submitted reports in real-time. Monitor case updates and stay informed about the status of your submissions.',
    keywords: ['track report', 'report status', 'case tracking', 'whistleblower tracking', 'report progress']
  },

  news: {
    title: 'Latest News & Bounties - Stay Informed',
    description: 'Stay updated with the latest news, active bounties, and most wanted alerts from across Nigeria. Your awareness helps build a safer community.',
    keywords: ['Nigeria news', 'bounties', 'most wanted', 'crime alerts', 'whistleblower news', 'security updates']
  },

  pricing: {
    title: 'Pricing Plans - Affordable Security Solutions',
    description: 'Choose from our flexible pricing plans for organizations. Get access to secure report management and transparency tools.',
    keywords: ['pricing', 'plans', 'organization subscription', 'report management', 'transparency tools', 'affordable security']
  },

  faq: {
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions about WhistleBlower.ng. Learn how to report crimes, place bounties, and use our platform securely.',
    keywords: ['FAQ', 'help', 'questions', 'whistleblower help', 'how to report', 'platform guide']
  },

  contact: {
    title: 'Contact Us - Get Support',
    description: 'Get in touch with WhistleBlower.ng support team. We\'re here to help with your reporting needs and platform questions.',
    keywords: ['contact', 'support', 'help', 'customer service', 'whistleblower support', 'get help']
  },

  privacy: {
    title: 'Privacy Policy - Your Data is Protected',
    description: 'Learn how WhistleBlower.ng protects your privacy and secures your data. We are committed to maintaining your anonymity and security.',
    keywords: ['privacy policy', 'data protection', 'anonymity', 'security', 'whistleblower privacy']
  },

  terms: {
    title: 'Terms of Service - Platform Guidelines',
    description: 'Read WhistleBlower.ng\'s terms of service and platform guidelines. Understand your rights and responsibilities when using our platform.',
    keywords: ['terms of service', 'platform terms', 'guidelines', 'whistleblower terms', 'user agreement']
  },

  disclaimer: {
    title: 'Disclaimer - Important Information',
    description: 'Important disclaimer information about WhistleBlower.ng platform usage, limitations, and user responsibilities.',
    keywords: ['disclaimer', 'platform disclaimer', 'limitations', 'user responsibility', 'whistleblower disclaimer']
  },

  partner: {
    title: 'Partner Program - Join Our Network',
    description: 'Join WhistleBlower.ng\'s partner network of organizations and government agencies. Enhance transparency and accountability in your operations.',
    keywords: ['partner program', 'organization partnership', 'government agencies', 'transparency', 'accountability', 'partner network']
  },

  secureData: {
    title: 'How We Secure Your Data - Privacy & Security',
    description: 'Learn about WhistleBlower.ng\'s advanced security measures and data protection protocols. Your anonymity and data security are our priority.',
    keywords: ['data security', 'privacy protection', 'encryption', 'anonymity', 'secure platform', 'data protection']
  }
};

/**
 * Generate SEO metadata for news posts
 * @param {Object} post - News post data
 * @returns {Object} SEO metadata for news post
 */
export const generateNewsPostSEO = (post) => {
  const title = post.title;
  const description = post.content 
    ? post.content.replace(/<[^>]*>/g, '').substring(0, 160)
    : `Read about ${post.title} on WhistleBlower.ng`;
  
  const image = post.featured_image 
    ? (post.featured_image.startsWith('http') ? post.featured_image : `${SITE_CONFIG.url}${post.featured_image.startsWith('/') ? '' : '/'}${post.featured_image}`)
    : SITE_CONFIG.defaultImage;

  const articleData = {
    title,
    description,
    image,
    publishedDate: post.created_at,
    modifiedDate: post.updated_at,
    url: `${SITE_CONFIG.url}/news/post/${post.id}`
  };

  // Category-specific keywords
  const categoryKeywords = {
    bounty: ['bounty', 'reward', 'information', 'case', 'investigation'],
    most_wanted: ['most wanted', 'fugitive', 'criminal', 'wanted person', 'law enforcement'],
    news: ['news', 'update', 'security', 'crime', 'alert']
  };

  const keywords = [
    ...SITE_CONFIG.keywords,
    ...(categoryKeywords[post.category] || []),
    post.category
  ];

  const seoMeta = generateSEOMeta({
    title,
    description,
    image,
    url: post.slug ? `/news/post/${post.slug}` : `/news/post/${title?.toLowerCase()?.replace(/[^\w\s-]/g, '').trim().replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')}`,
    type: 'article',
    keywords,
    article: {
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
      section: post.category,
      tags: [post.category, 'whistleblower', 'Nigeria']
    }
  });

  return {
    ...seoMeta,
    structuredData: STRUCTURED_DATA_TEMPLATES.article(articleData)
  };
};

/**
 * Generate SEO metadata for bounty posts
 * @param {Object} bounty - Bounty post data
 * @returns {Object} SEO metadata for bounty post
 */
export const generateBountyPostSEO = (bounty) => {
  const title = bounty.title;
  const description = bounty.content 
    ? bounty.content.replace(/<[^>]*>/g, '').substring(0, 160)
    : `View bounty information for ${bounty.title} on WhistleBlower.ng`;
  
  const image = bounty.featured_image 
    ? (bounty.featured_image.startsWith('http') ? bounty.featured_image : `${SITE_CONFIG.url}${bounty.featured_image}`)
    : SITE_CONFIG.defaultImage;

  return generateSEOMeta({
    title: `Bounty: ${title}`,
    description,
    image,
    url: `/bounties/${bounty.id}`,
    type: 'article',
    keywords: ['bounty', 'reward', 'information', 'Nigeria', 'whistleblower', bounty.category],
    article: {
      publishedTime: bounty.created_at,
      modifiedTime: bounty.updated_at,
      section: 'Bounty',
      tags: ['bounty', 'reward', bounty.category, 'whistleblower', 'Nigeria']
    }
  });
};
