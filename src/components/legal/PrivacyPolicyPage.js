'use client';

import LegalDocumentPage from '@/components/legal/LegalDocumentPage';
import {
  PRIVACY_HIGHLIGHTS,
  PRIVACY_META,
  PRIVACY_SECTIONS,
} from '@/lib/privacyPolicyContent';

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentPage
      meta={PRIVACY_META}
      highlights={PRIVACY_HIGHLIGHTS}
      sections={PRIVACY_SECTIONS}
      badgeIcon="policy"
      badgeLabel="Legal"
      titleBefore="Privacy"
      titleGradient="Policy"
      subtitle="How ThryvLoop collects, uses, and protects your data — for users and businesses in India and internationally. Covers every product feature, integration, and third party in our stack."
      footerTitle="Your trust matters to us"
      footerBody={
        <>
          This Privacy Policy describes how ThryvLoop handles personal data for users in India and
          worldwide, including rights under the DPDPA, GDPR, CCPA/CPRA, and other applicable laws.
          Read it together with our{' '}
          <a href="/terms" className="font-medium text-[var(--primary)] hover:underline">
            Terms of Service
          </a>
          . This document is not legal advice.
        </>
      }
      footerActions={[
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Help Centre', href: '/help' },
        {
          label: 'Contact Privacy Team',
          href: `mailto:${PRIVACY_META.contactEmail}`,
          primary: true,
        },
      ]}
      sidebar={{
        helpText: 'Visit our Help Centre, Terms of Service, or email our privacy team.',
        links: [
          { label: 'Help Centre', href: '/help' },
          { label: 'Terms of Service', href: '/terms' },
          { label: PRIVACY_META.contactEmail, href: `mailto:${PRIVACY_META.contactEmail}` },
        ],
      }}
    />
  );
}
