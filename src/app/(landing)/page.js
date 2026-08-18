'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Landing from '@/components/landing/LandingPage';

function SignedInHomeRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const redirectUrl = searchParams.get('redirect_url');
    router.replace(redirectUrl?.startsWith('/') ? redirectUrl : '/home');
  }, [isLoaded, isSignedIn, router, searchParams]);

  return null;
}

export default function Home() {
  return (
    <>
      <Suspense fallback={null}>
        <SignedInHomeRedirect />
      </Suspense>
      <Landing />
    </>
  );
}
