import { getUserStorageItem } from '@/utils/userStorage';

export function hasSpacesMediaConfigured(userId) {
  if (typeof window === 'undefined') return false;
  const videoId = getUserStorageItem(userId, 'focus-background-video-id', 'focus-background-video-id');
  const vol = getUserStorageItem(userId, 'focus-video-volume', 'focus-video-volume');
  const parsed = vol ? parseInt(vol, 10) : 0;
  return !!(videoId && !Number.isNaN(parsed) && parsed > 0);
}

export function isSpacesPausedByUser(userId) {
  if (typeof window === 'undefined') return false;
  return getUserStorageItem(userId, 'focus-spaces-paused', 'focus-spaces-paused') === 'true';
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

export function getStoredSpacesVolume(userId) {
  if (typeof window === 'undefined') return 50;
  const saved = getUserStorageItem(userId, 'focus-video-volume', 'focus-video-volume');
  const parsed = saved ? parseInt(saved, 10) : 50;
  return Number.isNaN(parsed) ? 50 : Math.max(0, Math.min(100, parsed));
}

/** Whether the Spaces background video should be mounted (visual, not audio). */
export function shouldShowSpacesBackground(userId, videoId = null) {
  if (typeof window === 'undefined') return false;
  if (videoId) return true;
  return hasSpacesMediaConfigured(userId);
}
