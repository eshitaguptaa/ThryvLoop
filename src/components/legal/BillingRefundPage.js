'use client';

import LegalDocumentPage from '@/components/legal/LegalDocumentPage';
import {
  BILLING_HIGHLIGHTS,
  BILLING_META,
  BILLING_SECTIONS,
} from '@/lib/billingRefundContent';

export default function BillingRefundPage() {
  return (
    <LegalDocumentPage
      meta={BILLING_META}
      highlights={BILLING_HIGHLIGHTS}
      sections={BILLING_SECTIONS}
      badgeIcon="payments"
      badgeLabel="Billing"
      titleBefore="Billing &"
      titleGradient="Refunds"
      subtitle="How paid plans, checkout consent, renewals, taxes, and refunds work when ThryvLoop billing is enabled — with consumer protections for India and international users."
      footerTitle="Billing questions?"
      footerBody="Core features may still be free. When you purchase a plan, this Policy applies together with our Terms of Service."
      footerActions={[
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Contact Support', href: `mailto:${BILLING_META.contactEmail}`, primary: true },
      ]}
      sidebar={{
        helpText: 'Pricing on the landing page is informational until checkout is live.',
        links: [
          { label: 'Terms of Service', href: '/terms' },
          { label: 'Help Centre', href: '/help' },
          { label: BILLING_META.contactEmail, href: `mailto:${BILLING_META.contactEmail}` },
        ],
      }}
    />
  );
}
