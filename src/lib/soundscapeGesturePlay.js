import {
  SOUNDSCAPE_SOUND_FILES,
  normalizeActiveSound,
} from '@/lib/soundscapeConstants';
import { playSoundscapeAudioImmediate } from '@/lib/soundscapeAudioEngine';
import { hasSpacesMediaConfigured, getStoredSpacesVolume } from '@/lib/spacesPlayback';
import { loadYouTubeIframeApi } from '@/lib/youtubeIframeApi';
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
 * does not defer play() after idle. Spaces YouTube is activated immediately too.
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

  if (!hasSpacesMediaConfigured(userId)) return;

  const spacesVol = getStoredSpacesVolume(userId);
  const playbackVol = Math.round(spacesVol * (master / 100));

  window.dispatchEvent(new CustomEvent('focus-spaces-activate'));
  void loadYouTubeIframeApi();
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
