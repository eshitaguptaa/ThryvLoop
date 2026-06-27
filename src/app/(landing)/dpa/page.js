import { Suspense } from 'react';
import DpaPage from '@/components/legal/DpaPage';
import { SITE_NAME } from '@/lib/siteConfig';

export const metadata = {
  title: 'Data Processing Agreement',
  description:
    'ThryvLoop DPA for business customers — processor obligations, subprocessors, security, and B2B team workspace data handling.',
  alternates: { canonical: '/dpa' },
  openGraph: {
    title: `Data Processing Agreement | ${SITE_NAME}`,
    description: 'B2B data processing agreement for ThryvLoop team workspaces.',
  },
  robots: { index: true, follow: true },
};

export default function DpaRoute() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground landing-page">
          Loading…
        </div>
      }
    >
      <DpaPage />
    </Suspense>
  );
}
