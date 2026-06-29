'use client';

import { useEffect, useState } from 'react';
import { AUTH_TRANSITION_EVENT, isAuthTransitionActive } from '@/lib/authTransition';

export function useAuthTransitionActive() {
  const [active, setActive] = useState(
    () => typeof window !== 'undefined' && isAuthTransitionActive(),
  );

  useEffect(() => {
    const sync = () => setActive(isAuthTransitionActive());
    sync();
    window.addEventListener(AUTH_TRANSITION_EVENT, sync);
    return () => window.removeEventListener(AUTH_TRANSITION_EVENT, sync);
  }, []);

  return active;
}
