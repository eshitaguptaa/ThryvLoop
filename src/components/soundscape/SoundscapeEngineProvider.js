'use client';

import { useUser } from '@clerk/nextjs';
import { useSoundscapeEngine } from '@/hooks/soundscape/useSoundscapeEngine';

/**
 * Global soundscape audio engine — mount once in the app shell.
 */
export default function SoundscapeEngineProvider({ children }) {
  const { user } = useUser();
  useSoundscapeEngine(user?.id ?? null);
  return children;
}
