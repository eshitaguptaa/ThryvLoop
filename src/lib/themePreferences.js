import {
  getUserStorageItem,
  getSupabaseClient,
  setUserStorageItem,
} from '@/utils/userStorage';

/** Must match `storageKey` on next-themes ThemeProvider. */
export const NEXT_THEMES_STORAGE_KEY = 'thryvloop-theme';

export const THEME_STORAGE_KEY = 'ui-theme';
export const THEME_PREF_KEY = 'ui-theme';

export const THEME_OPTIONS = ['light', 'dark', 'system'];

/** @param {string|null|undefined} value */
export function isValidTheme(value) {
  return THEME_OPTIONS.includes(value);
}

/** Resolve whether the boot loader should use the dark palette (sync, before React paint). */
export function resolveLoaderThemeDark() {
  if (typeof window === 'undefined') return true;
  const root = document.documentElement;
  if (root.classList.contains('dark')) return true;
  if (root.classList.contains('light')) return false;
  try {
    const stored = localStorage.getItem(NEXT_THEMES_STORAGE_KEY);
    if (stored === 'light') return false;
    if (stored === 'dark') return true;
  } catch {
    // ignore
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Read theme from next-themes localStorage (shared across signed-in and signed-out pages). */
export function readBrowserTheme() {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(NEXT_THEMES_STORAGE_KEY);
    if (isValidTheme(stored)) return stored;
  } catch {
    // ignore
  }
  return null;
}

/** Keep next-themes storage in sync with explicit saves. */
export function writeBrowserTheme(theme) {
  if (typeof window === 'undefined' || !isValidTheme(theme)) return;
  try {
    localStorage.setItem(NEXT_THEMES_STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

/**
 * Load theme preference — browser choice first, then user storage, Supabase, then system.
 * @param {string|null} userId
 * @returns {Promise<'light'|'dark'|'system'>}
 */
export async function loadThemePreference(userId) {
  const browser = readBrowserTheme();
  if (browser === 'light' || browser === 'dark') return browser;

  if (typeof window !== 'undefined') {
    const local = getUserStorageItem(userId, THEME_STORAGE_KEY);
    if (isValidTheme(local) && local !== 'system') return local;

    if (userId) {
      const anon = getUserStorageItem(null, THEME_STORAGE_KEY);
      if (isValidTheme(anon) && anon !== 'system') return anon;
    }
  }

  if (browser === 'system') return 'system';

  if (typeof window !== 'undefined' && userId) {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('value')
          .eq('user_id', userId)
          .eq('key', THEME_PREF_KEY)
          .maybeSingle();
        if (!error && data?.value) {
          const remote =
            typeof data.value === 'string' ? data.value : data.value?.theme;
          if (isValidTheme(remote)) {
            setUserStorageItem(userId, THEME_STORAGE_KEY, remote);
            return remote;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return 'system';
}

/**
 * Persist theme preference locally and sync to Supabase.
 * Writes to the shared browser key so landing + app stay aligned.
 * @param {string|null} userId
 * @param {'light'|'dark'|'system'} theme
 */
export async function saveThemePreference(userId, theme) {
  if (!isValidTheme(theme)) return;

  if (typeof window !== 'undefined') {
    writeBrowserTheme(theme);
    setUserStorageItem(null, THEME_STORAGE_KEY, theme);
    if (userId) {
      setUserStorageItem(userId, THEME_STORAGE_KEY, theme);
    }
  }

  if (typeof window === 'undefined' || !userId) return;

  try {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.from('user_preferences').upsert(
      {
        user_id: userId,
        key: THEME_PREF_KEY,
        value: theme,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,key' }
    );
  } catch {
    // ignore
  }
}
