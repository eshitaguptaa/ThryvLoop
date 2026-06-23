import { getSoundscapeSoundName } from '@/lib/soundscapeConstants';
import { resumeSoundscapeFromUserGesture } from '@/lib/soundscapeGesturePlay';
import { getUserStorageItem, setUserStorageItem } from '@/utils/userStorage';

export function isSpacesConfigured(userId) {
  if (typeof window === 'undefined' || !userId) return false;
  const videoId = getUserStorageItem(userId, 'focus-background-video-id', 'focus-background-video-id');
  const volume = getUserStorageItem(userId, 'focus-video-volume', 'focus-video-volume');
  const parsed = volume ? parseInt(volume, 10) : 0;
  return !!(videoId && !Number.isNaN(parsed) && parsed > 0);
}

export function hasAudibleComposerSounds(sounds) {
  return sounds.some((s) => s.id !== 'spaces' && (s.volume ?? 50) > 0);
}

export function readGlobalVolume(userId) {
  const raw = getUserStorageItem(userId, 'soundscape-global-volume', 'soundscape-global-volume');
  const parsed = raw ? parseInt(raw, 10) : 75;
  return Number.isNaN(parsed) ? 75 : Math.max(0, Math.min(100, parsed));
}

/** Whether the mix is actually producing sound (matches MusicWidget showAsPlaying). */
export function isMixAudible(sounds, playing, spacesPaused, userId) {
  if (!playing) return false;
  const master = readGlobalVolume(userId);
  const composerAudible = master > 0 && hasAudibleComposerSounds(sounds);
  const spacesAudible = !spacesPaused && isSpacesConfigured(userId);
  return composerAudible || spacesAudible;
}

/**
 * Read the current soundscape mix from user storage.
 * @param {string|null} userId
 */
export function readSoundscapeSnapshot(userId) {
  if (typeof window === 'undefined' || !userId) {
    return {
      activeSounds: [],
      isPlaying: false,
      spacesPaused: true,
      sessionActive: false,
      globalVolume: 75,
      showAsPlaying: false,
      spacesActive: false,
    };
  }

  let activeSounds = [];
  try {
    const saved = getUserStorageItem(userId, 'soundscape-active-sounds', 'soundscape-active-sounds');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        activeSounds = parsed.filter((sound) => {
          if (sound.id === 'spaces') return isSpacesConfigured(userId);
          return true;
        });
      }
    }
  } catch {
    activeSounds = [];
  }

  const savedPlaying =
    getUserStorageItem(userId, 'soundscape-is-playing', 'soundscape-is-playing') === 'true';
  const sessionActive =
    getUserStorageItem(userId, 'soundscape-session-active', 'soundscape-session-active') === 'true';
  const spacesPaused =
    getUserStorageItem(userId, 'focus-spaces-paused', 'focus-spaces-paused') === 'true';
  const spacesInMix = !spacesPaused && isSpacesConfigured(userId) && savedPlaying;

  if (spacesInMix && !activeSounds.some((s) => s.id === 'spaces')) {
    const spacesVolume = getUserStorageItem(userId, 'focus-video-volume', 'focus-video-volume');
    activeSounds.push({
      id: 'spaces',
      name: 'Spaces',
      volume: spacesVolume ? parseInt(spacesVolume, 10) : 50,
      category: 'Atmosphere',
    });
  }

  const isPlaying = sessionActive && savedPlaying;
  const globalVolume = readGlobalVolume(userId);
  const showAsPlaying = isMixAudible(activeSounds, isPlaying, spacesPaused, userId);
  const spacesActive = !spacesPaused && isSpacesConfigured(userId);

  return {
    activeSounds,
    isPlaying,
    spacesPaused,
    sessionActive,
    globalVolume,
    showAsPlaying,
    spacesActive,
  };
}

export function withDisplayNames(sounds) {
  return sounds.map((s) => ({
    ...s,
    name: getSoundscapeSoundName(s.id) || s.name || s.id,
  }));
}

/**
 * Toggle play/pause — same behavior from home card and music widget.
 * @param {string} userId
 * @param {{ activeSounds: object[], isPlaying: boolean, spacesPaused: boolean }} current
 */
export function toggleSoundscapePlayPause(userId, current) {
  if (typeof window === 'undefined' || !userId) return { playing: false };

  const snapshot = current ?? readSoundscapeSnapshot(userId);
  const currentlyPlaying = isMixAudible(
    snapshot.activeSounds,
    snapshot.isPlaying,
    snapshot.spacesPaused,
    userId
  );
  const next = !currentlyPlaying;

  if (!next) {
    setUserStorageItem(userId, 'focus-spaces-paused', 'true');
    setUserStorageItem(userId, 'soundscape-is-playing', 'false');
    setUserStorageItem(userId, 'soundscape-session-active', 'false');
    window.dispatchEvent(
      new CustomEvent('soundscape-play-pause-changed', {
        detail: { isPlaying: false, muteSpaces: true },
      })
    );
    return { playing: false };
  }

  setUserStorageItem(userId, 'focus-spaces-paused', 'false');
  setUserStorageItem(userId, 'soundscape-is-playing', 'true');
  setUserStorageItem(userId, 'soundscape-session-active', 'true');
  resumeSoundscapeFromUserGesture(userId);
  window.dispatchEvent(
    new CustomEvent('soundscape-play-pause-changed', {
      detail: { isPlaying: true, bootstrapSpaces: true, immediate: true },
    })
  );
  window.dispatchEvent(new CustomEvent('focus-spaces-resume'));
  return { playing: true };
}

export function openSoundscapeComposer() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('open-soundscape-composer'));
}
