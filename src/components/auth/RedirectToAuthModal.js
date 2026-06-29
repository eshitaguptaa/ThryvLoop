'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AUTH_MODAL_SIGN_IN, authModalUrl } from '@/lib/authRoutes';

/** Redirect signed-out protected routes to the landing auth modal — no blocking overlay. */
export default function RedirectToAuthModal({ mode = AUTH_MODAL_SIGN_IN }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const redirectUrl = pathname && pathname !== '/' ? pathname : undefined;
    router.replace(authModalUrl(mode, redirectUrl));
  }, [router, pathname, mode]);

  return null;
}
