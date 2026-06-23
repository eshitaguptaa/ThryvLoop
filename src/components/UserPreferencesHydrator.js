'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useUser } from '@clerk/nextjs';
import {
  isValidTheme,
  loadThemePreference,
  readBrowserTheme,
  saveThemePreference,
  THEME_STORAGE_KEY,
} from '@/lib/themePreferences';
import { getUserStorageItem } from '@/utils/userStorage';

/**
 * Hydrates theme preference from storage/Supabase into next-themes for all routes.
 * The shared browser key wins so landing-page changes apply after sign-in.
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
        const browser = readBrowserTheme();
        if (browser === 'light' || browser === 'dark') {
          saved = browser;
        } else {
          const hasUserTheme = isValidTheme(getUserStorageItem(userId, THEME_STORAGE_KEY));
          if (!hasUserTheme) {
            const anonTheme = getUserStorageItem(null, THEME_STORAGE_KEY);
            if (isValidTheme(anonTheme) && anonTheme !== 'system') {
              saved = anonTheme;
            }
          }
        }

        const userStored = getUserStorageItem(userId, THEME_STORAGE_KEY);
        if (userStored !== saved) {
          await saveThemePreference(userId, saved);
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
