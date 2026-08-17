'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import InviteJoinModal from '@/components/b2b/InviteJoinModal';

/**
 * Membership can lag one request after accept. Refresh until the org layout
 * can render the real workspace (congrats overlay lives there).
 */
export default function WorkspaceJoinRetry({ orgSlug, workspaceName }) {
  const router = useRouter();
  const attemptsRef = useRef(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      attemptsRef.current += 1;
      if (attemptsRef.current >= 8) {
        window.clearInterval(id);
        window.location.replace(`/o/${encodeURIComponent(orgSlug)}`);
        return;
      }
      router.refresh();
    }, 700);
    return () => window.clearInterval(id);
  }, [orgSlug, router]);

  return (
    <InviteJoinModal
      phase="joining"
      workspaceName={workspaceName}
      surface="page"
    />
  );
}
