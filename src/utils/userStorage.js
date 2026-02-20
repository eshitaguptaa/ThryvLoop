import { createSupabaseClient } from '@/lib/supabaseClient';

const STORAGE_PREFIX = 'thryvloop';

// In-memory Supabase access token (set by app when Clerk session is ready)
let supabaseAccessToken = null;

/**
 * Set the Supabase auth token (e.g. from Clerk getToken({ template: 'supabase' })).
 * Call this when the user session is available so getSupabaseClient() can use it.
 */
export function setSupabaseAuthToken(token) {
  supabaseAccessToken = token;
}

/**
 * Get a Supabase client instance. Uses the token set via setSupabaseAuthToken when available.
 */
export function getSupabaseClient() {
  return createSupabaseClient(supabaseAccessToken);
}

function storageKey(userId, key) {
  const part = userId ? `user:${userId}` : 'anon';
  return `${STORAGE_PREFIX}:${part}:${key}`;
}

/**
 * Get a string value from user-scoped storage (localStorage in browser).
 * @param {string|null} userId - Clerk user id (or null for anonymous)
 * @param {string} key - Storage key
 * @param {string} [storageKeySuffix] - Optional key suffix (defaults to key)
 */
export function getUserStorageItem(userId, key, storageKeySuffix = key) {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(storageKey(userId, storageKeySuffix));
  } catch {
    return null;
  }
}

/**
 * Get a JSON value from user-scoped storage.
 */
export function getUserStorageJson(userId, key, storageKeySuffix = key) {
  const raw = getUserStorageItem(userId, key, storageKeySuffix);
  if (raw == null || raw === '') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Set a string value in user-scoped storage.
 */
export function setUserStorageItem(userId, key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(userId, key), String(value));
  } catch {
    // ignore
  }
}

/**
 * Set a JSON-serializable value in user-scoped storage.
 */
export function setUserStorageJson(userId, key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(userId, key), JSON.stringify(value));
  } catch {
    // ignore
  }
}

/**
 * Remove a key from user-scoped storage.
 */
export function removeUserStorageItem(userId, key) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(storageKey(userId, key));
  } catch {
    // ignore
  }
}

const FOCUS_TIMER_STATE_KEY = 'focus_timer_state';

/**
 * Focus timer state shape for Supabase (user_preferences).
 * Used so the user can continue from where they left off after logging back in.
 */
export async function getFocusTimerStateFromSupabase(userId) {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return null;
    const { data, error } = await supabase
      .from('user_preferences')
      .select('value')
      .eq('user_id', userId)
      .eq('key', FOCUS_TIMER_STATE_KEY)
      .maybeSingle();
    if (error || !data?.value) return null;
    return data.value;
  } catch {
    return null;
  }
}

/**
 * Persist focus timer state to Supabase (user_preferences).
 */
export async function setFocusTimerStateToSupabase(userId, state) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: userId,
          key: FOCUS_TIMER_STATE_KEY,
          value: state,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,key' }
      );
  } catch {
    // ignore
  }
}
