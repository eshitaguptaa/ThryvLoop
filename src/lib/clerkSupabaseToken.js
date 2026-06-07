import { setSupabaseAuthToken } from '@/utils/userStorage';

/** Set during sign-out so in-flight effects skip Clerk token requests. */
let authRequestsSuspended = false;

/** Call before signOut to avoid Clerk "active session" errors from in-flight requests. */
export function suspendClerkAuthRequests() {
  authRequestsSuspended = true;
  setSupabaseAuthToken(null);
}

/** Re-enable token fetches after a successful sign-in. */
export function resumeClerkAuthRequests() {
  authRequestsSuspended = false;
}

/**
 * Safely fetch Clerk's Supabase JWT. Returns null when signed out, suspended, or on failure.
 * @param {() => Promise<string|null|undefined>} getToken from useAuth()
 * @param {boolean} [isSignedIn]
 */
export async function getClerkSupabaseToken(getToken, isSignedIn = true) {
  if (authRequestsSuspended || isSignedIn === false || !getToken) return null;
  try {
    const token = await getToken({ template: 'supabase' });
    return token ?? null;
  } catch {
    return null;
  }
}
