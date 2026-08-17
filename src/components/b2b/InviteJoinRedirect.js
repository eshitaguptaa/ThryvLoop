'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  buildWorkspaceWelcomePath,
  peekInviteJoinPath,
  peekInviteJustJoined,
} from '@/lib/inviteJoin';
import { markAuthDestinationReady } from '@/lib/authTransition';

/** After login, skip /o accept UI and finish the invite in the workspace. */
export default function InviteJoinRedirect() {
  const router = useRouter();

  useEffect(() => {
    markAuthDestinationReady();
    const joined = peekInviteJustJoined();
    if (joined?.slug) {
      router.replace(buildWorkspaceWelcomePath(joined.slug));
      return;
    }
    const path = peekInviteJoinPath();
    if (path) router.replace(path);
  }, [router]);

  return null;
}
