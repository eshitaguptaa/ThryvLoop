import { Suspense } from 'react';
import PrivacyPolicyPage from '@/components/legal/PrivacyPolicyPage';
import { SITE_NAME } from '@/lib/siteConfig';

export const metadata = {
  title: 'Privacy Policy',
  description:
    'ThryvLoop Privacy Policy for India and international users — DPDPA, GDPR, CCPA rights, data collection, cross-border transfers, and business customers.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: `Privacy Policy | ${SITE_NAME}`,
    description:
      'ThryvLoop Privacy Policy — data practices for Indian and international users under DPDPA, GDPR, and applicable privacy laws.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground landing-page">
          Loading privacy policy…
        </div>
      }
    >
      <PrivacyPolicyPage />
    </Suspense>
  );
}
