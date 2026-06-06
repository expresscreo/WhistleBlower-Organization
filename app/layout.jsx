import '@/index.css';
import ScopedGoogleAnalytics from '@/components/ScopedGoogleAnalytics';
import Providers from './providers';
import { resolveGaMeasurementId } from '@/lib/env';

const gaMeasurementId = resolveGaMeasurementId();
const enableAnalytics = process.env.NODE_ENV === 'production';

export const metadata = {
  title: 'WhistleBlower.ng — Report Crime Securely, Earn Rewards',
  description:
    'Empowering Nigerian citizens to safely report crimes and illegal activities to appropriate public agencies. Stay anonymous, protect your identity, and help build a safer Nigeria.',
  metadataBase: new URL('https://whistleblower.ng'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'WhistleBlower.ng — Report Crime Securely, Earn Rewards',
    description:
      'Empowering Nigerian citizens to safely report crimes and illegal activities to appropriate public agencies. Stay anonymous, protect your identity, and help build a safer Nigeria.',
    url: 'https://whistleblower.ng/',
    siteName: 'WhistleBlower.ng',
    images: [
      {
        url: 'https://whistleblower.ng/WBMedia/general/banner-WhistleBlower.jpeg',
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhistleBlower.ng — Report Crime Securely, Earn Rewards',
    description:
      'Empowering Nigerian citizens to safely report crimes and illegal activities to appropriate public agencies. Stay anonymous, protect your identity, and help build a safer Nigeria.',
    images: ['https://whistleblower.ng/WBMedia/general/banner-WhistleBlower.jpeg'],
  },
  icons: {
    icon: '/WBMedia/general/FAVICON-WhistleBlower.png',
  },
};

export const viewport = {
  themeColor: '#FF5100',
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'WhistleBlower.ng',
  url: 'https://whistleblower.ng',
  logo: 'https://whistleblower.ng/WBMedia/general/banner-WhistleBlower.jpeg',
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'support@whistleblower.ng',
    contactType: 'Customer Support',
  },
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Is whistleblowing anonymous?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. You can report anonymously or provide contact details if you want to claim a reward.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I get my reward?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Rewards are paid through Interswitch PayCode without exposing your personal bank details.',
      },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
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
