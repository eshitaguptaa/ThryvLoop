'use client';

import { useAuth } from '@clerk/nextjs';
import { usePathname, useSearchParams } from 'next/navigation';
import RedirectToAuthModal from '@/components/auth/RedirectToAuthModal';

export default function OrgAreaShell({ children }) {
  const { isLoaded, isSignedIn } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onWorkspacePath = pathname.startsWith('/o/') && pathname !== '/o/';
  const isInvite =
    onWorkspacePath
    && (
      searchParams.has('__clerk_ticket')
      || searchParams.get('from_invite') === '1'
      || searchParams.has('invite_email')
    );

  if (!isLoaded) return null;

  if (!isSignedIn && !isInvite) {
    return <RedirectToAuthModal />;
  }

  return children;
}
