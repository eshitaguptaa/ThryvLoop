import { SOUNDSCAPE_SOUND_FILES } from '@/lib/soundscapeConstants';

/** @type {Record<string, HTMLAudioElement>} */
const audioElements = {};

/** @type {Record<string, number>} */
export const soundscapeSoundTimestamps = {};

/**
 * Reuse existing HTMLAudioElement instances across route/layout remounts.
 * @param {string} soundId
 * @param {string} src
 */
export function getOrCreateSoundscapeAudio(soundId, src) {
  let audio = audioElements[soundId];
  if (!audio) {
    audio = new Audio(src);
    audio.loop = true;
    audio.preload = 'auto';
    audioElements[soundId] = audio;
    return { audio, created: true };
  }

  audio.preload = 'auto';
  try {
    const nextSrc = new URL(src, window.location.origin).href;
    if (audio.src !== nextSrc) {
      audio.src = src;
    }
  } catch {
    audio.src = src;
  }

  return { audio, created: false };
}

/** Decode buffers ahead of time so play() is instant after idle. */
export function warmSoundscapeAudio(soundId, src) {
  const { audio } = getOrCreateSoundscapeAudio(soundId, src);
  try {
    audio.load();
  } catch {
    // ignore — play() will retry
  }
  return audio;
}

/** Start or resume a layer at full level during a user gesture (no fade). */
export function playSoundscapeAudioImmediate(soundId, src, targetVolume) {
  if (targetVolume <= 0) return null;
  const { audio } = getOrCreateSoundscapeAudio(soundId, src);
  try {
    audio.load();
  } catch {
    // play() will retry
  }
  audio.volume = targetVolume;
  void audio.play().catch(() => {});
  return audio;
}

/**
 * Play every layer in a mix immediately — must run inside a user gesture (click).
 * @param {Array<{ id: string, volume: number }>} sounds
 * @param {number} masterVol 0–100
 * @param {string|null} soloId
 */
export function playSoundscapeMixImmediate(sounds, masterVol, soloId = null) {
  if (!Array.isArray(sounds) || masterVol <= 0) return;
  sounds.forEach((sound) => {
    if (!sound?.id || sound.id === 'spaces') return;
    const src = SOUNDSCAPE_SOUND_FILES[sound.id];
    if (!src) return;
    let layerVol = (sound.volume / 100) * (masterVol / 100);
    if (soloId !== null && sound.id !== soloId) layerVol = 0;
    if (layerVol <= 0) return;
    playSoundscapeAudioImmediate(sound.id, src, layerVol);
  });
}

/** Preload all sounds in the current mix. */
export function warmSoundscapeMix(sounds) {
  if (!Array.isArray(sounds)) return;
  sounds.forEach((sound) => {
    if (!sound?.id || sound.id === 'spaces') return;
    const file = SOUNDSCAPE_SOUND_FILES[sound.id];
    if (file) warmSoundscapeAudio(sound.id, file);
  });
}

/** @param {string} soundId */
export function getSoundscapeAudio(soundId) {
  return audioElements[soundId] ?? null;
}

/** @param {string} soundId */
export function removeSoundscapeAudio(soundId) {
  const audio = audioElements[soundId];
  if (!audio) return;
  audio.pause();
  audio.src = '';
  delete audioElements[soundId];
  delete soundscapeSoundTimestamps[soundId];
}

export function stopAllSoundscapeAudioElements() {
  Object.keys(audioElements).forEach((soundId) => {
    removeSoundscapeAudio(soundId);
  });
}
