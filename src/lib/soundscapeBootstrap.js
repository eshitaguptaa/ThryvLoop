import { DEFAULT_BOOTSTRAP_SOUNDS } from '@/lib/soundscapeConstants';
import { soundscapeAudioManager } from '@/lib/soundscape/audioManager';
import { persistTracks, persistSessionPlaying } from '@/lib/soundscape/persistence';

/**
 * Start Spaces ambient audio when the mix is empty (e.g. first home mini player play).
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
 * Load the default soundscape mix and start audio during a user gesture.
 */
export function bootstrapDefaultSoundsIfEmpty(ctx) {
  if (ctx.getActiveSoundCount() > 0) return false;

  const finalSounds = DEFAULT_BOOTSTRAP_SOUNDS.map((sound) => ({ ...sound }));

  ctx.hasStartedPlaybackRef.current = true;
  ctx.setSessionActive(true);
  ctx.initializedRef.current = true;
  ctx.setActiveSounds(finalSounds);

  if (ctx.userId) {
    persistTracks(ctx.userId, finalSounds);
    persistSessionPlaying(ctx.userId, true, { syncOnly: true });
  } else {
    ctx.setJson('soundscape-active-sounds', finalSounds);
  }

  void soundscapeAudioManager.playMix(finalSounds, ctx.globalVolume, null, { immediate: true });

  if (typeof window === 'undefined') return true;

  window.dispatchEvent(new CustomEvent('soundscape-state-changed'));
  return true;
}
