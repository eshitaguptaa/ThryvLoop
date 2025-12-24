'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFocus } from '@/contexts/FocusContext';

export default function TimerPage() {
  const router = useRouter();
  const { setShowTimer, setShowTaskBar } = useFocus();

  useEffect(() => {
    setShowTimer(true);
    setShowTaskBar(true);
    router.replace('/focus');
  }, [router, setShowTimer, setShowTaskBar]);

  return null;
}

