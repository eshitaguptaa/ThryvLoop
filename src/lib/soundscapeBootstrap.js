import { DEFAULT_BOOTSTRAP_SOUNDS, SOUNDSCAPE_SOUND_FILES } from '@/lib/soundscapeConstants';
import { getOrCreateSoundscapeAudio } from '@/lib/soundscapeAudioEngine';

/**
 * Start Spaces ambient audio when the mix is empty (e.g. first home mini player play).
 * @param {object} ctx
 * @param {() => number} ctx.getActiveSoundCount
 * @param {() => number} ctx.getSpacesVolume
 * @param {number} ctx.globalVolume
 * @param {import('react').MutableRefObject<boolean>} ctx.hasStartedPlaybackRef
 * @param {import('react').MutableRefObject<boolean>} ctx.initializedRef
 * @param {(value: boolean) => void} ctx.setSessionActive
 */
export function bootstrapSpacesAudioIfEmpty(ctx) {
  if (ctx.getActiveSoundCount() > 0) return false;

  ctx.hasStartedPlaybackRef.current = true;
  ctx.setSessionActive(true);
  ctx.initializedRef.current = true;

  const spacesVolume = ctx.getSpacesVolume();
  const playbackVolume = Math.round(spacesVolume * (ctx.globalVolume / 100));

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('focus-spaces-activate'));
    window.dispatchEvent(
      new CustomEvent('focus-volume-changed', {
        detail: { volume: playbackVolume, playbackOnly: true },
      })
    );
    window.dispatchEvent(new CustomEvent('soundscape-state-changed'));
  }

  return true;
}

/**
 * Load the default soundscape mix and start audio during a user gesture (e.g. home play button).
 * @param {object} ctx
 * @param {() => number} ctx.getActiveSoundCount
 * @param {import('react').MutableRefObject<Record<string, HTMLAudioElement>>} ctx.audioRefs
 * @param {import('react').MutableRefObject<Record<string, number>>} ctx.soundTimestampsRef
 * @param {import('react').MutableRefObject<boolean>} ctx.hasStartedPlaybackRef
 * @param {import('react').MutableRefObject<boolean>} ctx.initializedRef
 * @param {number} ctx.globalVolume
 * @param {(sounds: object[]) => void} ctx.setActiveSounds
 * @param {(key: string, value: string) => void} ctx.setItem
 * @param {(key: string, value: object) => void} ctx.setJson
 * @param {(value: boolean) => void} ctx.setSessionActive
 * @param {(audio: HTMLAudioElement, targetVolume: number, duration?: number) => void} ctx.fadeInAudio
 */
export function bootstrapDefaultSoundsIfEmpty(ctx) {
  if (ctx.getActiveSoundCount() > 0) return false;

  const finalSounds = DEFAULT_BOOTSTRAP_SOUNDS.map((sound) => ({ ...sound }));
  const now = Date.now();
  finalSounds.forEach((sound) => {
    ctx.soundTimestampsRef.current[sound.id] = now;
  });

  ctx.hasStartedPlaybackRef.current = true;
  ctx.setSessionActive(true);
  ctx.initializedRef.current = true;
  ctx.setActiveSounds(finalSounds);
  ctx.setJson('soundscape-active-sounds', finalSounds);

  finalSounds.forEach((sound) => {
    const src = SOUNDSCAPE_SOUND_FILES[sound.id];
    if (!src) return;
    const { audio, created } = getOrCreateSoundscapeAudio(sound.id, src);
    ctx.audioRefs.current[sound.id] = audio;
    const targetVolume = (sound.volume / 100) * (ctx.globalVolume / 100);
    if (created || audio.paused) {
      ctx.fadeInAudio(audio, targetVolume, 500);
    }
  });

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('soundscape-state-changed'));
  }

  return true;
}
