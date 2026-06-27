import { Suspense } from 'react';
import HelpCentrePage from '@/components/help/HelpCentrePage';
import { SITE_NAME } from '@/lib/siteConfig';

export const metadata = {
  title: 'Help Centre',
  description:
    'Find answers about ThryvLoop — focus mode, tasks, calendar sync, Google integrations, ThryvBot, analytics, and troubleshooting.',
  alternates: {
    canonical: '/help',
  },
  openGraph: {
    title: `Help Centre | ${SITE_NAME}`,
    description:
      'Complete guides and troubleshooting for ThryvLoop — your unified productivity workspace.',
  },
};

export default function HelpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground landing-page">
          Loading help centre…
        </div>
      }
    >
      <HelpCentrePage />
    </Suspense>
  );
}
