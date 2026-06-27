import { Suspense } from 'react';
import BillingRefundPage from '@/components/legal/BillingRefundPage';
import { SITE_NAME } from '@/lib/siteConfig';

export const metadata = {
  title: 'Billing & Refunds',
  description:
    'ThryvLoop billing, checkout consent, renewals, taxes, and refund policy for paid plans in India and internationally.',
  alternates: { canonical: '/billing' },
  openGraph: {
    title: `Billing & Refunds | ${SITE_NAME}`,
    description: 'Billing and refund policy for ThryvLoop paid plans.',
  },
  robots: { index: true, follow: true },
};

export default function BillingRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground landing-page">
          Loading…
        </div>
      }
    >
      <BillingRefundPage />
    </Suspense>
  );
}
