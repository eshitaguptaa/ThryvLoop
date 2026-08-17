import {
  enforceSingleInstanceCategories,
  normalizeActiveSound,
} from '@/lib/soundscapeConstants';
import { DEFAULT_SPACES_VOLUME } from '@/lib/spacesConstants';
import { getStoredSpacesVolume } from '@/lib/spacesPlayback';
import { duckSpacesAudio } from '@/lib/soundscape/spacesPlaybackPolicy';
import { getUserStorageItem, setUserStorageItem, setUserStorageJson } from '@/utils/userStorage';

const MAX_TRACKS = 3;

export function clampVolume(value, fallback = 50) {
  const parsed = typeof value === 'number' ? value : parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.max(0, Math.min(100, parsed));
}

/** @param {string | null} userId */
export function loadPersistedTracks(userId) {
  if (typeof window === 'undefined' || !userId) return [];

  const raw = getUserStorageItem(userId, 'soundscape-active-sounds', 'soundscape-active-sounds');
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return enforceSingleInstanceCategories(
      parsed.map((sound) => normalizeActiveSound(sound)).filter(Boolean)
    ).slice(0, MAX_TRACKS);
  } catch {
    return [];
  }
}

/** @param {string | null} userId */
export function loadMasterVolume(userId) {
  if (typeof window === 'undefined' || !userId) return 75;
  const raw = getUserStorageItem(userId, 'soundscape-global-volume', 'soundscape-global-volume');
  return clampVolume(raw ? parseInt(raw, 10) : 75, 75);
}

/** @param {string | null} userId */
export function loadSessionPlaying(userId) {
  if (typeof window === 'undefined' || !userId) return false;
  const sessionActive =
    getUserStorageItem(userId, 'soundscape-session-active', 'soundscape-session-active') === 'true';
  const isPlaying =
    getUserStorageItem(userId, 'soundscape-is-playing', 'soundscape-is-playing') === 'true';
  return sessionActive && isPlaying;
}

/** @param {string | null} userId — true when muted or never explicitly unmuted */
export function loadSpacesPaused(userId) {
  if (typeof window === 'undefined' || !userId) return true;
  const raw = getUserStorageItem(userId, 'focus-spaces-paused', 'focus-spaces-paused');
  if (raw == null || raw === '') return true;
  return raw === 'true';
}

/** @param {string | null} userId */
export function loadSpacesVolume(userId) {
  if (typeof window === 'undefined' || !userId) return DEFAULT_SPACES_VOLUME;
  return getStoredSpacesVolume(userId);
}

/**
 * @param {string | null} userId
 * @param {object[]} tracks
 */
export function persistTracks(userId, tracks) {
  if (!userId || typeof window === 'undefined') return;
  const payload = tracks
    .filter((t) => t.id !== 'spaces')
    .map(({ id, name, volume, category }) => ({ id, name, volume, category }));
  setUserStorageJson(userId, 'soundscape-active-sounds', payload);
  dispatchStateChanged();
}

/**
 * @param {string | null} userId
 * @param {number} volume
 */
export function persistMasterVolume(userId, volume) {
  if (!userId || typeof window === 'undefined') return;
  setUserStorageItem(userId, 'soundscape-global-volume', String(clampVolume(volume)));
  dispatchStateChanged();
}

/**
 * @param {string | null} userId
 * @param {boolean} playing
 * @param {{ bootstrapSpaces?: boolean, immediate?: boolean, syncOnly?: boolean }} [detail]
 */
export function persistSessionPlaying(userId, playing, detail = {}) {
  if (!userId || typeof window === 'undefined') return;

  setUserStorageItem(userId, 'soundscape-is-playing', playing ? 'true' : 'false');
  setUserStorageItem(userId, 'soundscape-session-active', playing ? 'true' : 'false');

  if (!playing) {
    duckSpacesAudio();
  } else if (detail.bootstrapSpaces) {
    setUserStorageItem(userId, 'focus-spaces-paused', 'false');
  }

  window.dispatchEvent(
    new CustomEvent('soundscape-play-pause-changed', {
      detail: { isPlaying: playing, ...detail },
    })
  );
  dispatchStateChanged();
}

/**
 * @param {string | null} userId
 * @param {number} volume
 */
export function persistSpacesVolume(userId, volume) {
  if (!userId || typeof window === 'undefined') return;
  const clamped = clampVolume(volume);
  setUserStorageItem(userId, 'focus-video-volume', String(clamped));
  window.dispatchEvent(
    new CustomEvent('focus-volume-changed', { detail: { volume: clamped } })
  );
}

export function dispatchStateChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('soundscape-state-changed'));
}

export { MAX_TRACKS };
