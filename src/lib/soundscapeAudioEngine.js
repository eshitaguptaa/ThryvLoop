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
    audioElements[soundId] = audio;
    return { audio, created: true };
  }

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
