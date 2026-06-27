'use client';

import LegalDocumentPage from '@/components/legal/LegalDocumentPage';
import {
  TERMS_HIGHLIGHTS,
  TERMS_META,
  TERMS_SECTIONS,
} from '@/lib/termsOfServiceContent';

export default function TermsOfServicePage() {
  return (
    <LegalDocumentPage
      meta={TERMS_META}
      highlights={TERMS_HIGHLIGHTS}
      sections={TERMS_SECTIONS}
      badgeIcon="contract"
      badgeLabel="Legal"
      titleBefore="Terms of"
      titleGradient="Service"
      subtitle="Rules for using every part of ThryvLoop — for users and businesses in India and worldwide. Covers Focus, Tasks, Calendar, Meet, ThryvBot, integrations, team workspaces, and your legal rights."
      footerTitle="Questions about these Terms?"
      footerBody={
        <>
          These Terms work together with our{' '}
          <a href="/privacy" className="font-medium text-[var(--primary)] hover:underline">
            Privacy Policy
          </a>
          . They govern all features of the ThryvLoop application as described above. This
          document is not legal advice — consult qualified counsel for your situation.
        </>
      }
      footerActions={[
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Help Centre', href: '/help' },
        { label: 'Contact Support', href: `mailto:${TERMS_META.contactEmail}`, primary: true },
      ]}
      sidebar={{
        helpText: 'Read our Privacy Policy, Help Centre, or email support.',
        links: [
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Help Centre', href: '/help' },
          { label: TERMS_META.contactEmail, href: `mailto:${TERMS_META.contactEmail}` },
        ],
      }}
    />
  );
}
