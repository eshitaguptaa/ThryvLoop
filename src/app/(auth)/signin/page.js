'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignInPage() {
  const router = useRouter();

  useEffect(() => {
    // If already authenticated, redirect to home
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      router.push('/home');
    } else {
      // Redirect to landing page with signin modal
      router.push('/?auth=signin');
    }
  }, [router]);

  return null;
}

