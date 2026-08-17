'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { isAuthTransitionActive, markAuthDestinationReady } from '@/lib/authTransition';

/**
 * During a login transition, notify AuthTransitionHost once `ready` becomes true.
 * @param {boolean} ready
 */
export function useReportAuthDestinationReady(ready) {
  const reportedRef = useRef(false);
  const pathname = usePathname();

  useEffect(() => {
    reportedRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (!ready || reportedRef.current) return;
    if (!isAuthTransitionActive()) return;
    reportedRef.current = true;
    markAuthDestinationReady();
  }, [ready]);
}
