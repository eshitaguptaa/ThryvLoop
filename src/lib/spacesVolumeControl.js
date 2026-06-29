import { DEFAULT_SPACES_VOLUME } from '@/lib/spacesConstants';
import { isSpacesPausedByUser, isSpacesPlaybackIntent } from '@/lib/spacesPlayback';
import { getUserStorageItem, setUserStorageItem } from '@/utils/userStorage';

const PREVIOUS_VOLUME_KEY = 'focus-spaces-previous-volume';
const VOLUME_KEY = 'focus-video-volume';
const PAUSED_KEY = 'focus-spaces-paused';

/** Whether Spaces should show the muted UI (matches SoundscapeComposer). */
export function isSpacesVisuallyMuted(userId, volume) {
  if (volume === 0) return true;
  if (isSpacesPausedByUser(userId)) return true;
  return !isSpacesPlaybackIntent(userId);
}

export function dispatchFocusSpacesPauseChanged(paused) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('focus-spaces-pause-changed', { detail: { paused } }),
  );
  window.dispatchEvent(new CustomEvent('soundscape-state-changed'));
}

export function getSpacesPreviousVolume(userId) {
  const saved = getUserStorageItem(userId, PREVIOUS_VOLUME_KEY, PREVIOUS_VOLUME_KEY);
  const parsed = saved ? parseInt(saved, 10) : DEFAULT_SPACES_VOLUME;
  return Number.isNaN(parsed) || parsed <= 0 ? DEFAULT_SPACES_VOLUME : parsed;
}

export function saveSpacesPreviousVolume(userId, vol) {
  if (vol > 0) {
    setUserStorageItem(userId, PREVIOUS_VOLUME_KEY, vol.toString());
  }
}

/** Track last non-zero level when muting via slider or button. */
export function rememberSpacesVolumeTransition(userId, currentVolume, newVolume) {
  if (newVolume > 0 && currentVolume === 0) {
    saveSpacesPreviousVolume(userId, newVolume);
  } else if (newVolume === 0 && currentVolume > 0) {
    saveSpacesPreviousVolume(userId, currentVolume);
  } else if (newVolume > 0) {
    saveSpacesPreviousVolume(userId, newVolume);
  }
}

/** Match SoundscapeComposer effective Spaces playback level. */
export function resolveSpacesPlaybackVolume(userId, baseVolume, { soloSoundId = null } = {}) {
  if (isSpacesPausedByUser(userId)) return 0;
  if (!isSpacesPlaybackIntent(userId)) return 0;
  if (soloSoundId !== null) return 0;
  if (baseVolume <= 0) return 0;
  return baseVolume;
}

function ensureSpacesPlaybackIntent(userId) {
  if (isSpacesPlaybackIntent(userId)) return;
  setUserStorageItem(userId, 'soundscape-session-active', 'true');
  setUserStorageItem(userId, 'soundscape-is-playing', 'true');
}

/**
 * Persist a base Spaces volume and broadcast the same events as SoundscapeComposer settings.
 * @returns {number} clamped volume
 */
export function applySpacesBaseVolume(
  userId,
  currentVolume,
  newVolume,
  { soloSoundId = null, forceLevel = true, skipBaseEvent = false } = {},
) {
  if (typeof window === 'undefined') return 0;

  const clamped = Math.max(0, Math.min(100, newVolume));
  rememberSpacesVolumeTransition(userId, currentVolume, clamped);
  setUserStorageItem(userId, VOLUME_KEY, clamped.toString());

  if (clamped > 0) {
    setUserStorageItem(userId, PAUSED_KEY, 'false');
    ensureSpacesPlaybackIntent(userId);
  } else {
    setUserStorageItem(userId, PAUSED_KEY, 'false');
  }

  if (!skipBaseEvent) {
    window.dispatchEvent(
      new CustomEvent('focus-volume-changed', { detail: { volume: clamped } }),
    );
  }

  const playbackVolume = resolveSpacesPlaybackVolume(userId, clamped, { soloSoundId });
  window.dispatchEvent(
    new CustomEvent('focus-volume-changed', {
      detail: {
        volume: playbackVolume,
        playbackOnly: true,
        baseVolume: clamped,
        forceLevel,
      },
    }),
  );

  if (clamped > 0) {
    window.dispatchEvent(new CustomEvent('focus-spaces-activate'));
    window.dispatchEvent(
      new CustomEvent('soundscape-play-pause-changed', { detail: { isPlaying: true, syncOnly: true } }),
    );
  }

  window.dispatchEvent(new CustomEvent('soundscape-state-changed'));
  return clamped;
}

export function toggleSpacesMute(userId, currentVolume, options = {}) {
  if (currentVolume > 0) {
    return applySpacesBaseVolume(userId, currentVolume, 0, options);
  }
  return applySpacesBaseVolume(userId, currentVolume, getSpacesPreviousVolume(userId), options);
}
