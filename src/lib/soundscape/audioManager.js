import { SOUNDSCAPE_SOUND_FILES } from '@/lib/soundscapeConstants';

const PLAYBACK_FADE_MS = 280;

/** @typedef {'idle' | 'loading' | 'ready' | 'error'} LoadState */

/**
 * Singleton audio engine with per-track operation sequencing to prevent race conditions.
 */
class SoundscapeAudioManager {
  /** @type {Map<string, { audio: HTMLAudioElement, opSeq: number, loadState: LoadState, fadeRaf: number | null }>} */
  #tracks = new Map();

  /** @type {number} */
  #mixOpSeq = 0;

  /** @returns {LoadState} */
  getLoadState(soundId) {
    return this.#tracks.get(soundId)?.loadState ?? 'idle';
  }

  /**
   * @param {string} soundId
   * @returns {{ audio: HTMLAudioElement, loadState: LoadState } | null}
   */
  ensureTrack(soundId) {
    if (typeof window === 'undefined') return null;

    const src = SOUNDSCAPE_SOUND_FILES[soundId];
    if (!src) return null;

    let entry = this.#tracks.get(soundId);
    if (!entry) {
      const audio = new Audio(src);
      audio.loop = true;
      audio.preload = 'auto';

      entry = { audio, opSeq: 0, loadState: 'loading', fadeRaf: null };
      this.#tracks.set(soundId, entry);

      const markReady = () => {
        if (entry.loadState !== 'error') entry.loadState = 'ready';
      };
      const markError = () => {
        entry.loadState = 'error';
      };

      audio.addEventListener('canplaythrough', markReady, { once: true });
      audio.addEventListener('loadeddata', markReady, { once: true });
      audio.addEventListener('error', markError, { once: true });

      try {
        audio.load();
      } catch {
        entry.loadState = 'error';
      }
    }

    return { audio: entry.audio, loadState: entry.loadState };
  }

  /** @param {ReturnType<SoundscapeAudioManager['ensureTrack']> extends infer T ? NonNullable<T> : never} entry */
  #cancelFade(entry) {
    if (!entry?.fadeRaf) return;
    cancelAnimationFrame(entry.fadeRaf);
    entry.fadeRaf = null;
  }

  /**
   * @param {number} trackVolume 0–100
   * @param {number} masterVolume 0–100
   * @param {string | null} soloId
   * @param {string} trackId
   */
  computeVolume(trackVolume, masterVolume, soloId, trackId) {
    if (masterVolume <= 0 || trackVolume <= 0) return 0;
    if (soloId && soloId !== trackId) return 0;
    return (trackVolume / 100) * (masterVolume / 100);
  }

  /**
   * @param {string} soundId
   * @param {number} volume 0–1
   */
  setVolume(soundId, volume) {
    const entry = this.#tracks.get(soundId);
    if (!entry) return;
    this.#cancelFade(entry);
    entry.audio.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * @param {string} soundId
   * @param {number} targetVolume 0–1
   * @param {{ immediate?: boolean }} [options]
   */
  async playTrack(soundId, targetVolume, { immediate = false } = {}) {
    const trackEntry = this.#tracks.get(soundId) ?? this.ensureTrack(soundId);
    if (!trackEntry || targetVolume <= 0) {
      return { ok: false, blocked: false, superseded: false };
    }

    const entry = this.#tracks.get(soundId);
    if (!entry) return { ok: false, blocked: false, superseded: false };

    const seq = ++entry.opSeq;
    const mixSeq = this.#mixOpSeq;

    try {
      this.#cancelFade(entry);

      if (immediate) {
        entry.audio.volume = targetVolume;
      }

      if (entry.audio.paused) {
        await entry.audio.play();
      }

      if (seq !== entry.opSeq || mixSeq !== this.#mixOpSeq) {
        return { ok: false, blocked: false, superseded: true };
      }

      if (!immediate && targetVolume > 0) {
        this.#fadeTo(entry, targetVolume, PLAYBACK_FADE_MS);
      }

      return { ok: true, blocked: false, superseded: false };
    } catch {
      if (seq !== entry.opSeq) {
        return { ok: false, blocked: false, superseded: true };
      }
      return { ok: false, blocked: true, superseded: false };
    }
  }

  /** @param {string} soundId */
  pauseTrack(soundId) {
    const entry = this.#tracks.get(soundId);
    if (!entry) return;
    entry.opSeq += 1;
    this.#cancelFade(entry);
    entry.audio.pause();
  }

  pauseAll() {
    this.#mixOpSeq += 1;
    for (const soundId of this.#tracks.keys()) {
      this.pauseTrack(soundId);
    }
  }

  /**
   * @param {Array<{ id: string, volume: number }>} tracks
   * @param {number} masterVolume
   * @param {string | null} soloId
   * @param {{ immediate?: boolean }} [options]
   */
  async playMix(tracks, masterVolume, soloId, { immediate = false } = {}) {
    if (typeof window === 'undefined') {
      return { anyStarted: false, autoplayBlocked: false };
    }

    this.#mixOpSeq += 1;
    const mixSeq = this.#mixOpSeq;

    const activeIds = new Set(
      tracks.filter((t) => t?.id && t.id !== 'spaces').map((t) => t.id)
    );

    for (const soundId of this.#tracks.keys()) {
      if (!activeIds.has(soundId)) {
        this.pauseTrack(soundId);
      }
    }

    let anyStarted = false;
    let autoplayBlocked = false;

    for (const track of tracks) {
      if (!track?.id || track.id === 'spaces') continue;
      if (mixSeq !== this.#mixOpSeq) {
        return { anyStarted, autoplayBlocked };
      }

      const vol = this.computeVolume(track.volume, masterVolume, soloId, track.id);
      if (vol <= 0) {
        this.setVolume(track.id, 0);
        continue;
      }

      const result = await this.playTrack(track.id, vol, { immediate });
      if (result.superseded) {
        return { anyStarted, autoplayBlocked };
      }
      if (result.ok) anyStarted = true;
      if (result.blocked) autoplayBlocked = true;
    }

    return { anyStarted, autoplayBlocked };
  }

  /**
   * @param {Array<{ id: string, volume: number }>} tracks
   * @param {number} masterVolume
   * @param {string | null} soloId
   */
  syncVolumes(tracks, masterVolume, soloId) {
    for (const track of tracks) {
      if (!track?.id || track.id === 'spaces') continue;
      const vol = this.computeVolume(track.volume, masterVolume, soloId, track.id);
      this.setVolume(track.id, vol);
    }
  }

  /** @param {string} soundId */
  removeTrack(soundId) {
    const entry = this.#tracks.get(soundId);
    if (!entry) return;
    entry.opSeq += 1;
    this.#cancelFade(entry);
    try {
      entry.audio.pause();
      entry.audio.src = '';
      entry.audio.load();
    } catch {
      // ignore cleanup errors
    }
    this.#tracks.delete(soundId);
  }

  destroyAll() {
    this.#mixOpSeq += 1;
    for (const soundId of [...this.#tracks.keys()]) {
      this.removeTrack(soundId);
    }
  }

  /**
   * @param {{ audio: HTMLAudioElement, opSeq: number, loadState: LoadState, fadeRaf: number | null }} entry
   * @param {number} targetVolume
   * @param {number} durationMs
   */
  #fadeTo(entry, targetVolume, durationMs) {
    this.#cancelFade(entry);
    const start = performance.now();
    const from = entry.audio.volume;

    const step = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      entry.audio.volume = from + (targetVolume - from) * t;
      if (t < 1) {
        entry.fadeRaf = requestAnimationFrame(step);
      } else {
        entry.fadeRaf = null;
      }
    };

    entry.fadeRaf = requestAnimationFrame(step);
  }

  /** @param {string} soundId */
  getAudio(soundId) {
    return this.#tracks.get(soundId)?.audio ?? null;
  }

  /** @param {Array<{ id: string }>} tracks */
  warmMix(tracks) {
    if (typeof window === 'undefined') return;
    tracks.forEach((track) => {
      if (track?.id && track.id !== 'spaces') {
        this.ensureTrack(track.id);
      }
    });
  }
}

export const soundscapeAudioManager = new SoundscapeAudioManager();
