import {
  ensureSpacesStorageDefaults,
  getStoredSpacesVolume,
  hasSpacesMediaConfigured,
} from '@/lib/spacesPlayback';
import { getUserStorageItem, setUserStorageItem } from '@/utils/userStorage';

const PAUSED_KEY = 'focus-spaces-paused';

/** User explicitly muted Spaces in Soundscape Composer (not a transient session pause). */
export function isSpacesUserMuted(userId) {
  if (!userId || typeof window === 'undefined') return false;
  return getUserStorageItem(userId, PAUSED_KEY, PAUSED_KEY) === 'true';
}

/** @param {string | null} userId */
export function setSpacesUserMuted(userId, muted) {
  if (!userId || typeof window === 'undefined') return;
  setUserStorageItem(userId, PAUSED_KEY, muted ? 'true' : 'false');
}

/**
 * Whether Spaces ambient audio should join the mix when the user hits play.
 * Spaces plays unless the user muted it in the composer (toggle or volume at 0).
 */
export function shouldBootstrapSpacesOnPlay(userId) {
  if (!userId || !hasSpacesMediaConfigured(userId)) return false;
  if (isSpacesUserMuted(userId)) return false;
  return true;
}

/** Temporarily silence Spaces without persisting a user mute preference. */
export function duckSpacesAudio() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('focus-volume-changed', {
      detail: { volume: 0, playbackOnly: true, forceLevel: true },
    })
  );
}

/**
 * @param {string | null} userId
 * @param {number} [masterVolume] 0–100
 * @param {{ force?: boolean }} [options] — force skips auto-bootstrap policy (explicit composer unmute)
 */
export function activateSpacesAudio(userId, masterVolume = 75, options = {}) {
  if (!userId || typeof window === 'undefined') return;
  ensureSpacesStorageDefaults(userId);
  if (!options.force && !shouldBootstrapSpacesOnPlay(userId)) return;

  const raw = getUserStorageItem(userId, 'focus-video-volume', 'focus-video-volume');
  const parsed = raw ? parseInt(raw, 10) : getStoredSpacesVolume(userId);
  const spacesVol = Number.isNaN(parsed)
    ? getStoredSpacesVolume(userId)
    : Math.max(0, Math.min(100, parsed));
  const master = Math.max(0, Math.min(100, masterVolume));
  const playbackVol = Math.round(spacesVol * (master / 100));

  setSpacesUserMuted(userId, false);
  window.dispatchEvent(new CustomEvent('focus-spaces-activate'));
  window.dispatchEvent(
    new CustomEvent('focus-volume-changed', {
      detail: {
        volume: playbackVol,
        playbackOnly: true,
        baseVolume: spacesVol,
        forceLevel: true,
        rampMs: 0,
      },
    })
  );
}
