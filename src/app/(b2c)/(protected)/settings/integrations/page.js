'use client';

import { Suspense } from 'react';
import WorkspaceIntegrations from '@/components/workspace/WorkspaceIntegrations';

export default function IntegrationsPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-[#F1F5F9] via-white to-[#F8FAFC] px-4 py-10 sm:px-8 sm:py-14">
      <Suspense fallback={<div className="text-center text-gray-400 py-20">Loading…</div>}>
        <WorkspaceIntegrations />
      </Suspense>
    </div>
  );
}
