import {
  getUserStorageItem,
  getSupabaseClient,
  setUserStorageItem,
} from '@/utils/userStorage';

export const THEME_STORAGE_KEY = 'ui-theme';
export const THEME_PREF_KEY = 'ui-theme';

export const THEME_OPTIONS = ['light', 'dark', 'system'];

/** @param {string|null|undefined} value */
export function isValidTheme(value) {
  return THEME_OPTIONS.includes(value);
}

/**
 * Load theme preference — localStorage first, then Supabase.
 * @param {string|null} userId
 * @returns {Promise<'light'|'dark'|'system'>}
 */
export async function loadThemePreference(userId) {
  if (typeof window !== 'undefined' && userId) {
    const local = getUserStorageItem(userId, THEME_STORAGE_KEY);
    if (isValidTheme(local)) return local;
  }

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
 * @param {string|null} userId
 * @param {'light'|'dark'|'system'} theme
 */
export async function saveThemePreference(userId, theme) {
  if (!isValidTheme(theme)) return;

  if (typeof window !== 'undefined') {
    setUserStorageItem(userId, THEME_STORAGE_KEY, theme);
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
