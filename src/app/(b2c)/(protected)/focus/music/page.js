'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFocus } from '@/contexts/FocusContext';

export default function MusicPage() {
  const router = useRouter();
  const { setShowMusic } = useFocus();

  useEffect(() => {
    setShowMusic(true);
    router.replace('/focus');
  }, [router, setShowMusic]);

  return null;
}

