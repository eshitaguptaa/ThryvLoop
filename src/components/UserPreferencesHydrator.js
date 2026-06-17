'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useUser } from '@clerk/nextjs';
import {
  isValidTheme,
  loadThemePreference,
  saveThemePreference,
} from '@/lib/themePreferences';
import { getUserStorageItem } from '@/utils/userStorage';

/**
 * Hydrates theme preference from storage/Supabase into next-themes for all routes.
 * Migrates anonymous theme choice when a user signs in.
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
      let saved = await loadThemePreference(userId);

      if (userId) {
        const hasUserTheme = isValidTheme(getUserStorageItem(userId, 'ui-theme'));
        if (!hasUserTheme) {
          const anonTheme = getUserStorageItem(null, 'ui-theme');
          if (isValidTheme(anonTheme) && anonTheme !== 'system') {
            saved = anonTheme;
            await saveThemePreference(userId, anonTheme);
          }
        }
      }

      if (cancelled) return;

      setTheme(saved);
      hydratedForUser.current = userId;
      window.dispatchEvent(new CustomEvent('user-preferences-hydrated'));
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user?.id, setTheme]);

  return null;
}
