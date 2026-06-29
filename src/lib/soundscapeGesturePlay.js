import {
  SOUNDSCAPE_SOUND_FILES,
  normalizeActiveSound,
} from '@/lib/soundscapeConstants';
import { playSoundscapeAudioImmediate } from '@/lib/soundscapeAudioEngine';
import {
  activateSpacesAudio,
  shouldBootstrapSpacesOnPlay,
} from '@/lib/soundscape/spacesPlaybackPolicy';
import { getUserStorageItem, getUserStorageJson } from '@/utils/userStorage';

function readActiveSounds(userId) {
  const raw = getUserStorageJson(userId, 'soundscape-active-sounds', 'soundscape-active-sounds');
  if (!Array.isArray(raw)) return [];
  return raw.map((sound) => normalizeActiveSound(sound)).filter(Boolean);
}

function readGlobalVolume(userId) {
  const saved = getUserStorageItem(userId, 'soundscape-global-volume', 'soundscape-global-volume');
  const parsed = saved ? parseInt(saved, 10) : 75;
  return Number.isNaN(parsed) ? 75 : Math.max(0, Math.min(100, parsed));
}

/**
 * Start soundscape audio synchronously inside a click handler so the browser
 * does not defer play() after idle. Spaces joins only when policy allows.
 */
export function resumeSoundscapeFromUserGesture(userId) {
  if (!userId || typeof window === 'undefined') return;

  const master = readGlobalVolume(userId);
  const sounds = readActiveSounds(userId).filter((s) => s.id !== 'spaces');

  sounds.forEach((sound) => {
    const src = SOUNDSCAPE_SOUND_FILES[sound.id];
    if (!src) return;
    const layerVol = (sound.volume / 100) * (master / 100);
    playSoundscapeAudioImmediate(sound.id, src, layerVol);
  });

  if (shouldBootstrapSpacesOnPlay(userId)) {
    activateSpacesAudio(userId, master);
  }
}
