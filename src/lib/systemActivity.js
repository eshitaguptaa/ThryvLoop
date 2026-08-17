/**
 * System-wide activity / idle helpers (Idle Detection API).
 * Chromium only; requires permission + user gesture to request.
 */

export function isSystemIdleDetectionSupported() {
  return typeof window !== 'undefined' && typeof window.IdleDetector === 'function';
}

/**
 * @returns {Promise<'granted' | 'denied' | 'prompt' | 'unsupported'>}
 */
export async function getIdleDetectionPermissionState() {
  if (!isSystemIdleDetectionSupported()) return 'unsupported';
  try {
    if (navigator.permissions?.query) {
      // Some browsers type-narrow PermissionsName without idle-detection.
      const status = await navigator.permissions.query(
        /** @type {PermissionDescriptor} */ ({ name: /** @type {PermissionName} */ ('idle-detection') })
      );
      if (status.state === 'granted' || status.state === 'denied' || status.state === 'prompt') {
        return status.state;
      }
    }
  } catch {
    /* fall through */
  }
  return 'prompt';
}

/**
 * Must be called directly from a user gesture — do not await other work first,
 * or Chrome may drop transient activation and never show the prompt.
 * @returns {Promise<'granted' | 'denied' | 'unsupported' | 'no_gesture'>}
 */
export async function requestIdleDetectionPermission() {
  if (!isSystemIdleDetectionSupported()) return 'unsupported';
  try {
    const result = await window.IdleDetector.requestPermission();
    return result === 'granted' ? 'granted' : 'denied';
  } catch (e) {
    if (e && typeof e === 'object' && 'name' in e && e.name === 'NotAllowedError') {
      return 'no_gesture';
    }
    return 'denied';
  }
}

/**
 * Start monitoring OS-level user idle (works while ThryvLoop is in background).
 * Minimum threshold is 60s per spec.
 *
 * @param {{
 *   thresholdMs: number,
 *   onChange: (state: { idle: boolean, userState: string | null, screenState: string | null }) => void,
 *   signal?: AbortSignal,
 * }} opts
 * @returns {Promise<{ stop: () => void } | null>}
 */
export async function startSystemIdleMonitor({ thresholdMs, onChange, signal }) {
  if (!isSystemIdleDetectionSupported()) return null;
  const permission = await getIdleDetectionPermissionState();
  if (permission !== 'granted') return null;

  try {
    const detector = new window.IdleDetector();
    const emit = () => {
      const userState = detector.userState;
      const screenState = detector.screenState;
      const idle = userState === 'idle' || screenState === 'locked';
      onChange({ idle, userState, screenState });
    };
    detector.addEventListener('change', emit);
    await detector.start({
      threshold: Math.max(60_000, Math.floor(thresholdMs || 60_000)),
      signal,
    });
    emit();
    return {
      stop: () => {
        try {
          detector.removeEventListener('change', emit);
        } catch {
          /* ignore */
        }
      },
    };
  } catch (e) {
    console.warn('[system-activity] IdleDetector failed to start:', e);
    return null;
  }
}
