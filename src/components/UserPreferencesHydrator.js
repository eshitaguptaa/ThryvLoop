'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useUser } from '@clerk/nextjs';
import { loadThemePreference } from '@/lib/themePreferences';

/**
 * Hydrates user theme preference from storage/Supabase into next-themes on sign-in.
 */
export default function UserPreferencesHydrator() {
  const { user, isLoaded } = useUser();
  const { setTheme } = useTheme();
  const hydratedForUser = useRef(null);

  useEffect(() => {
    if (!isLoaded) return;

    const userId = user?.id ?? null;

    if (hydratedForUser.current === userId) return;

    let cancelled = false;

    (async () => {
      const saved = await loadThemePreference(userId);
      if (cancelled) return;
      setTheme(saved);
      hydratedForUser.current = userId;
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id, setTheme]);

  return null;
}
