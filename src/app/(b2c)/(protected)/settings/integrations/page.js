'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function IntegrationsRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    router.replace(query ? `/home?${query}` : '/home');
  }, [router, searchParams]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center text-muted-foreground text-sm">
      Opening settings…
    </div>
  );
}

/** Legacy route — redirects to home and opens the Integrations settings panel. */
export default function IntegrationsPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] flex items-center justify-center text-muted-foreground text-sm">Loading…</div>}>
      <IntegrationsRedirect />
    </Suspense>
  );
}
