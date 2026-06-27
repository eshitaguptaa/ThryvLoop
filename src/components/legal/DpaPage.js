'use client';

import LegalDocumentPage from '@/components/legal/LegalDocumentPage';
import { DPA_HIGHLIGHTS, DPA_META, DPA_SECTIONS } from '@/lib/dpaContent';

export default function DpaPage() {
  return (
    <LegalDocumentPage
      meta={DPA_META}
      highlights={DPA_HIGHLIGHTS}
      sections={DPA_SECTIONS}
      badgeIcon="groups"
      badgeLabel="B2B Legal"
      titleBefore="Data Processing"
      titleGradient="Agreement"
      subtitle="For organisations using ThryvLoop team workspaces. Defines processor obligations, subprocessors, security, and how to execute this DPA with your company."
      footerTitle="Need a signed DPA?"
      footerBody="Email us with your organisation details. This document supplements our Privacy Policy and Terms of Service."
      footerActions={[
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms of Service', href: '/terms' },
        { label: 'Request DPA', href: `mailto:${DPA_META.contactEmail}`, primary: true },
      ]}
      sidebar={{
        helpText: 'For individual users, see Privacy Policy. For teams, request DPA execution.',
        links: [
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Terms of Service', href: '/terms' },
          { label: DPA_META.contactEmail, href: `mailto:${DPA_META.contactEmail}` },
        ],
      }}
    />
  );
}
