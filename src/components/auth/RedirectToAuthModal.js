'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AUTH_MODAL_SIGN_IN, authModalUrl } from '@/lib/authRoutes';

export default function RedirectToAuthModal({ mode = AUTH_MODAL_SIGN_IN }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const redirectUrl = pathname && pathname !== '/' ? pathname : undefined;
    router.replace(authModalUrl(mode, redirectUrl));
  }, [router, pathname, mode]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-foreground text-xl">Redirecting…</div>
    </div>
  );
}
