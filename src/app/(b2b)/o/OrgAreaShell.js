'use client';

import { useAuth } from '@clerk/nextjs';
import RedirectToAuthModal from '@/components/auth/RedirectToAuthModal';

export default function OrgAreaShell({ children }) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return <RedirectToAuthModal />;
  }

  return children;
}
