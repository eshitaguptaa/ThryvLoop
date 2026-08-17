'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { peekInviteJoinPath } from '@/lib/inviteJoin';
import { markAuthDestinationReady } from '@/lib/authTransition';

/** Clerk session task after Google. Send invitees back to the join overlay. */
export default function InviteContinuePage() {
  const router = useRouter();

  useEffect(() => {
    markAuthDestinationReady();
    router.replace(peekInviteJoinPath() || '/o');
  }, [router]);

  return null;
}
