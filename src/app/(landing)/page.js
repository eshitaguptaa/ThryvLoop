'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Landing from '@/components/landing/LandingPage';

function LandingWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const redirectUrl = searchParams.get('redirect_url');
      router.replace(redirectUrl?.startsWith('/') ? redirectUrl : '/home');
    }
  }, [isLoaded, isSignedIn, router, searchParams]);

  return <Landing />;
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-muted-foreground">
          Loading...
        </div>
      }
    >
      <LandingWrapper />
    </Suspense>
  );
}
