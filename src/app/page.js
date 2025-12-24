'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Landing from '@/pages/Landing.js';

function LandingWrapper() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const authToken = localStorage.getItem('authToken');
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // In development, don't auto-redirect so you can test the landing page
    // In production, redirect authenticated users to home
    if (authToken && !isDevelopment) {
      router.push('/home');
    }
  }, [router]);

  return <Landing />;
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <LandingWrapper />
    </Suspense>
  );
}
