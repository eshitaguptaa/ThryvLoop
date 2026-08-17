'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AUTH_MODAL_SIGN_IN, authModalUrl } from '@/lib/authRoutes';

/** Redirect signed-out protected routes to the landing auth modal — no blocking overlay. */
export default function RedirectToAuthModal({ mode = AUTH_MODAL_SIGN_IN }) {
  const router = useRouter();

  useEffect(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    const redirectUrl = path && path !== '/' ? `${path}${search}` : undefined;
    router.replace(authModalUrl(mode, redirectUrl));
  }, [router, mode]);

  return null;
}
