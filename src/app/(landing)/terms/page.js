import { Suspense } from 'react';
import TermsOfServicePage from '@/components/legal/TermsOfServicePage';
import { SITE_NAME } from '@/lib/siteConfig';

export const metadata = {
  title: 'Terms of Service',
  description:
    'ThryvLoop Terms of Service for India and international users — acceptable use, AI, integrations, team workspaces, liability, and dispute resolution.',
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: `Terms of Service | ${SITE_NAME}`,
    description:
      'Terms governing use of ThryvLoop — all product features, India and international users, liability and acceptable use.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground landing-page">
          Loading terms of service…
        </div>
      }
    >
      <TermsOfServicePage />
    </Suspense>
  );
}
