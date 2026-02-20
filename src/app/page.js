'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Landing from '@/pages/Landing.js';

function LandingWrapper() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // In development, don't auto-redirect so you can test the landing page
    // In production, redirect authenticated users to home
    if (isLoaded && isSignedIn && !isDevelopment) {
      router.push('/home');
    }
  }, [isLoaded, isSignedIn, router]);

  return <Landing />;
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LandingWrapper />
    </Suspense>
  );
}
