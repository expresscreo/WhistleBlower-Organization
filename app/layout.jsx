import '@/index.css';
import ScopedGoogleAnalytics from '@/components/ScopedGoogleAnalytics';
import Providers from './providers';
import { resolveGaMeasurementId, resolveGoogleSiteVerification } from '@/lib/env';
import { resolveSiteUrl } from '@/lib/siteUrl';
import {
  SITE_CONFIG,
  STRUCTURED_DATA_TEMPLATES,
  DEFAULT_SEO_PAGES,
} from '@/lib/seoUtils';

const homeSeo = DEFAULT_SEO_PAGES.home;
import JsonLd from '@/components/JsonLd';

const gaMeasurementId = resolveGaMeasurementId();
const enableAnalytics = process.env.NODE_ENV === 'production';
const siteUrl = resolveSiteUrl();
const googleVerification = resolveGoogleSiteVerification();

export const metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: SITE_CONFIG.siteDisplayName,
  title: {
    default: homeSeo.title,
    template: '%s',
  },
  description: homeSeo.description,
  keywords: homeSeo.keywords.join(', '),
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': `${siteUrl}/feed.xml`,
    },
  },
  openGraph: {
    title: homeSeo.title,
    description: homeSeo.description,
    url: `${siteUrl}/`,
    siteName: SITE_CONFIG.siteDisplayName,
    images: [{ url: SITE_CONFIG.defaultImage }],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE_CONFIG.twitterHandle,
    title: homeSeo.title,
    description: homeSeo.description,
    images: [SITE_CONFIG.defaultImage],
  },
  icons: {
    icon: '/WBMedia/general/FAVICON-WhistleBlower.png',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  ...(googleVerification
    ? {
        verification: {
          google: googleVerification,
        },
      }
    : {}),
};

export const viewport = {
  themeColor: '#FF5100',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-NG" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap"
          rel="stylesheet"
        />
        <link rel="alternate" type="application/rss+xml" title={`${SITE_CONFIG.name} News`} href={`${siteUrl}/feed.xml`} />
        <JsonLd data={STRUCTURED_DATA_TEMPLATES.organization()} />
      </head>
      <body>
        <Providers>{children}</Providers>
        {enableAnalytics && gaMeasurementId ? (
          <ScopedGoogleAnalytics gaId={gaMeasurementId} />
        ) : null}
      </body>
    </html>
  );
}
