'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import AppLoadingScreen from '@/components/ui/AppLoadingScreen';
import { useAuthTransitionActive } from '@/hooks/useAuthTransitionActive';
import { AUTH_CLERK_LOADING_MESSAGE } from '@/lib/authTransitionMessages';

const MAX_VISIBLE_MS = 6000;

/** Clerk auth resolving — shown when not in an explicit login/logout transition. */
export default function ClerkShellLoader() {
  const authTransition = useAuthTransitionActive();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setDismissed(true), MAX_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (authTransition || dismissed || !mounted) return null;

  return createPortal(
    <AppLoadingScreen message={AUTH_CLERK_LOADING_MESSAGE} />,
    document.body,
  );
}
