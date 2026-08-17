'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { peekInviteJoinPath } from '@/lib/inviteJoin';
import { markAuthDestinationReady } from '@/lib/authTransition';

/** If Google dumped the invitee on /o, send them back to the join overlay. */
export default function InviteJoinRedirect() {
  const router = useRouter();

  useEffect(() => {
    markAuthDestinationReady();
    const path = peekInviteJoinPath();
    if (path) router.replace(path);
  }, [router]);

  return null;
}
