import { SOUNDSCAPE_SOUND_FILES } from '@/lib/soundscapeConstants';
import { soundscapeAudioManager } from '@/lib/soundscape/audioManager';

/** @deprecated Use soundscapeAudioManager — kept for legacy imports */
export const soundscapeSoundTimestamps = {};

export function getOrCreateSoundscapeAudio(soundId, src) {
  const entry = soundscapeAudioManager.ensureTrack(soundId);
  return { audio: entry?.audio ?? null, created: !!entry };
}

export function warmSoundscapeAudio(soundId) {
  soundscapeAudioManager.ensureTrack(soundId);
  return soundscapeAudioManager.getAudio(soundId);
}

export function playSoundscapeAudioImmediate(soundId, src, targetVolume) {
  if (targetVolume <= 0) return null;
  void soundscapeAudioManager.playTrack(soundId, targetVolume, { immediate: true });
  return soundscapeAudioManager.getAudio(soundId);
}

export function playSoundscapeMixImmediate(sounds, masterVol, soloId = null) {
  if (!Array.isArray(sounds) || masterVol <= 0) return;
  void soundscapeAudioManager.playMix(sounds, masterVol, soloId, { immediate: true });
}

export function warmSoundscapeMix(sounds) {
  soundscapeAudioManager.warmMix(sounds || []);
}

export function getSoundscapeAudio(soundId) {
  return soundscapeAudioManager.getAudio(soundId);
}

export function removeSoundscapeAudio(soundId) {
  soundscapeAudioManager.removeTrack(soundId);
  delete soundscapeSoundTimestamps[soundId];
}

export function stopAllSoundscapeAudioElements() {
  soundscapeAudioManager.destroyAll();
}

// silence unused import warning in some bundlers
void SOUNDSCAPE_SOUND_FILES;
