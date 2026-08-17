import { Suspense } from 'react';
import OrgAreaShell from '@/app/(b2b)/o/OrgAreaShell';

export const dynamic = 'force-dynamic';

export default function OrgAreaLayout({ children }) {
  return (
    <Suspense fallback={null}>
      <OrgAreaShell>{children}</OrgAreaShell>
    </Suspense>
  );
}
