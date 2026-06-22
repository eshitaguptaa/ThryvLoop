export const dynamic = 'force-dynamic';

import LandingJsonLd from '@/components/landing/LandingJsonLd';
import { DEFAULT_DESCRIPTION, getSiteUrl, SEO_KEYWORDS, SITE_NAME, SITE_TAGLINE } from '@/lib/siteConfig';

const siteUrl = getSiteUrl();

export const metadata = {
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: SEO_KEYWORDS,
  authors: [{ name: SITE_NAME, url: siteUrl }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — One Hub for Focus, Tasks & Productivity`,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: '/LandingPageImages/logo.png',
        width: 512,
        height: 512,
        alt: `${SITE_NAME} logo`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Transform Your Digital Workspace`,
    description: DEFAULT_DESCRIPTION,
    images: ['/LandingPageImages/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function LandingLayout({ children }) {
  return (
    <>
      <LandingJsonLd />
      {children}
    </>
  );
}
