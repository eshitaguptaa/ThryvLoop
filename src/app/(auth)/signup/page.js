'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    // If already authenticated, redirect to home
    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      router.push('/home');
    } else {
      // Redirect to landing page with signup modal
      router.push('/?auth=signup');
    }
  }, [router]);

  return null;
}

