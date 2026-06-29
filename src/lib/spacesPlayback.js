import { getUserStorageItem, setUserStorageItem } from '@/utils/userStorage';
import {
  DEFAULT_SPACES_VOLUME,
  resolveSpacesVideoId,
} from '@/lib/spacesConstants';

const VIDEO_KEY = 'focus-background-video-id';
const VOLUME_KEY = 'focus-video-volume';
const PAUSED_KEY = 'focus-spaces-paused';

export function getStoredSpacesVolume(userId) {
  if (typeof window === 'undefined') return DEFAULT_SPACES_VOLUME;
  const saved = getUserStorageItem(userId, VOLUME_KEY, VOLUME_KEY);
  if (saved == null || saved === '') return DEFAULT_SPACES_VOLUME;
  const parsed = parseInt(saved, 10);
  return Number.isNaN(parsed)
    ? DEFAULT_SPACES_VOLUME
    : Math.max(0, Math.min(100, parsed));
}

/** Spaces is available when a video id resolves (incl. default) and volume > 0. */
export function hasSpacesMediaConfigured(userId) {
  if (typeof window === 'undefined' || !userId) return false;
  const rawVideoId = getUserStorageItem(userId, VIDEO_KEY, VIDEO_KEY);
  const videoId = resolveSpacesVideoId(rawVideoId);
  return !!(videoId && getStoredSpacesVolume(userId) > 0);
}

/**
 * Persist default Spaces settings for first-time / fresh sessions.
 * Only fills missing keys — does not override explicit user choices.
 */
export function ensureSpacesStorageDefaults(userId) {
  if (typeof window === 'undefined' || !userId) return;

  const rawVideoId = getUserStorageItem(userId, VIDEO_KEY, VIDEO_KEY);
  const videoId = resolveSpacesVideoId(rawVideoId);
  if (!rawVideoId || rawVideoId !== videoId) {
    setUserStorageItem(userId, VIDEO_KEY, videoId);
  }

  const rawVolume = getUserStorageItem(userId, VOLUME_KEY, VOLUME_KEY);
  if (rawVolume == null || rawVolume === '') {
    setUserStorageItem(userId, VOLUME_KEY, String(DEFAULT_SPACES_VOLUME));
  }

  const rawPaused = getUserStorageItem(userId, PAUSED_KEY, PAUSED_KEY);
  if (rawPaused == null || rawPaused === '') {
    setUserStorageItem(userId, PAUSED_KEY, 'false');
  }
}

export function isSpacesPausedByUser(userId) {
  if (typeof window === 'undefined') return false;
  return getUserStorageItem(userId, PAUSED_KEY, PAUSED_KEY) === 'true';
}

/** Whether Spaces ambient audio should be playing (respects master play/pause). */
export function isSpacesPlaybackIntent(userId) {
  if (!hasSpacesMediaConfigured(userId)) return false;
  if (isSpacesPausedByUser(userId)) return false;

  const sessionActive =
    getUserStorageItem(userId, 'soundscape-session-active', 'soundscape-session-active') === 'true';
  const playing =
    getUserStorageItem(userId, 'soundscape-is-playing', 'soundscape-is-playing') === 'true';
  return sessionActive && playing;
}

/** Whether the Spaces background video should be mounted (visual, not audio). */
export function shouldShowSpacesBackground(userId, videoId = null) {
  if (typeof window === 'undefined') return false;
  if (videoId) return true;
  return hasSpacesMediaConfigured(userId);
}
