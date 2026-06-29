'use client';

import { create } from 'zustand';
import {
  SOUNDSCAPE_LIBRARY,
  enforceSingleInstanceCategories,
  getSoundscapeSoundName,
  normalizeActiveSound,
} from '@/lib/soundscapeConstants';
import {
  MAX_TRACKS,
  dispatchStateChanged,
  loadMasterVolume,
  loadPersistedTracks,
  loadSessionPlaying,
  loadSpacesPaused,
  loadSpacesVolume,
  persistMasterVolume,
  persistSessionPlaying,
  persistSpacesVolume,
  persistTracks,
} from '@/lib/soundscape/persistence';
import { DEFAULT_SPACES_VOLUME } from '@/lib/spacesConstants';
import { ensureSpacesStorageDefaults } from '@/lib/spacesPlayback';
import { getSpacesPreviousVolume, applySpacesBaseVolume } from '@/lib/spacesVolumeControl';
import {
  duckSpacesAudio,
  setSpacesUserMuted,
  shouldBootstrapSpacesOnPlay,
  activateSpacesAudio,
} from '@/lib/soundscape/spacesPlaybackPolicy';

/** @typedef {'idle' | 'loading' | 'ready' | 'error'} TrackLoadState */

/**
 * @typedef {object} SoundscapeTrack
 * @property {string} id
 * @property {string} name
 * @property {number} volume
 * @property {string} category
 * @property {boolean} playing - per-track play (when session is active)
 * @property {TrackLoadState} loadState
 */

const defaultState = {
  userId: null,
  hydrated: false,
  tracks: /** @type {SoundscapeTrack[]} */ ([]),
  masterVolume: 75,
  previousMasterVolume: 75,
  sessionPlaying: false,
  soloTrackId: null,
  autoplayBlocked: false,
  spacesVolume: DEFAULT_SPACES_VOLUME,
  spacesPaused: false,
  /** @type {Record<string, number>} */
  previousTrackVolumes: {},
};

/** @param {import('@/lib/soundscapeConstants').ReturnType<typeof normalizeActiveSound>} sound */
function toTrack(sound, loadState = 'idle') {
  if (!sound) return null;
  return {
    id: sound.id,
    name: sound.name || getSoundscapeSoundName(sound.id),
    volume: sound.volume ?? 50,
    category: sound.category || 'Atmosphere',
    playing: true,
    loadState,
  };
}

export const useSoundscapeStore = create((set, get) => ({
  ...defaultState,

  /** @param {string | null} userId */
  hydrate(userId) {
    if (!userId || typeof window === 'undefined') {
      set({ ...defaultState, hydrated: true });
      return;
    }

    ensureSpacesStorageDefaults(userId);

    const tracks = loadPersistedTracks(userId).map((s) => toTrack(s));
    set({
      userId,
      hydrated: true,
      tracks,
      masterVolume: loadMasterVolume(userId),
      previousMasterVolume: loadMasterVolume(userId) || 75,
      sessionPlaying: loadSessionPlaying(userId),
      spacesVolume: loadSpacesVolume(userId),
      spacesPaused: loadSpacesPaused(userId),
      soloTrackId: null,
      autoplayBlocked: false,
      previousTrackVolumes: {},
    });
  },

  reset() {
    set({ ...defaultState, hydrated: false });
  },

  setTrackLoadState(trackId, loadState) {
    set((state) => ({
      tracks: state.tracks.map((t) => (t.id === trackId ? { ...t, loadState } : t)),
    }));
  },

  setAutoplayBlocked(blocked) {
    set({ autoplayBlocked: blocked });
  },

  /** @param {number} volume */
  setMasterVolume(volume) {
    const clamped = Math.max(0, Math.min(100, volume));
    const { userId, masterVolume } = get();
    if (clamped > 0 && masterVolume === 0) {
      set({ previousMasterVolume: clamped });
    } else if (clamped === 0 && masterVolume > 0) {
      set({ previousMasterVolume: masterVolume });
    }
    set({ masterVolume: clamped });
    if (userId) persistMasterVolume(userId, clamped);
  },

  toggleMasterMute() {
    const { masterVolume, previousMasterVolume, sessionPlaying, userId } = get();
    if (!sessionPlaying) {
      if (masterVolume === 0) {
        get().setMasterVolume(previousMasterVolume > 0 ? previousMasterVolume : 75);
      }
      const bootstrapSpaces = userId ? shouldBootstrapSpacesOnPlay(userId) : false;
      get().playSession({ userGesture: true, bootstrapSpaces, immediate: true });
      return;
    }
    if (masterVolume === 0) {
      get().setMasterVolume(previousMasterVolume > 0 ? previousMasterVolume : 75);
    } else {
      get().setMasterVolume(0);
    }
  },

  /** @param {number} volume */
  setSpacesVolume(volume) {
    const clamped = Math.max(0, Math.min(100, volume));
    const { userId, spacesVolume: currentVol } = get();
    set({ spacesVolume: clamped });
    if (userId && typeof window !== 'undefined') {
      applySpacesBaseVolume(userId, currentVol, clamped, { forceLevel: true });
    }
  },

  toggleSpacesMute() {
    const { spacesPaused, spacesVolume, sessionPlaying, userId, masterVolume } = get();
    if (!userId) return;

    const resolveSpacesVolume = () => {
      if (spacesVolume > 0) return spacesVolume;
      const remembered = getSpacesPreviousVolume(userId);
      return remembered > 0 ? remembered : DEFAULT_SPACES_VOLUME;
    };

    if (!sessionPlaying) {
      const effectiveVol = resolveSpacesVolume();
      set({ spacesPaused: false, sessionPlaying: true, spacesVolume: effectiveVol });
      setSpacesUserMuted(userId, false);
      if (spacesVolume === 0) {
        persistSpacesVolume(userId, effectiveVol);
      }
      const bootstrapSpaces = shouldBootstrapSpacesOnPlay(userId);
      get().playSession({ userGesture: true, bootstrapSpaces: true, immediate: true });
      if (bootstrapSpaces && effectiveVol > 0) {
        activateSpacesAudio(userId, masterVolume, { force: true });
      }
      dispatchStateChanged();
      return;
    }

    if (spacesPaused || spacesVolume === 0) {
      const effectiveVol = resolveSpacesVolume();
      set({ spacesPaused: false, spacesVolume: effectiveVol });
      setSpacesUserMuted(userId, false);
      if (spacesVolume === 0) {
        persistSpacesVolume(userId, effectiveVol);
      }
      persistSessionPlaying(userId, true, { bootstrapSpaces: true, syncOnly: true });
      if (effectiveVol > 0) {
        activateSpacesAudio(userId, masterVolume, { force: true });
      }
    } else {
      set({ spacesPaused: true });
      setSpacesUserMuted(userId, true);
      duckSpacesAudio();
    }
    dispatchStateChanged();
  },

  /**
   * @param {string} soundId
   * @param {string} category
   */
  toggleLibrarySound(soundId, category) {
    const { tracks, userId, sessionPlaying } = get();
    const existing = tracks.find((t) => t.id === soundId);

    if (existing) {
      get().removeTrack(soundId);
      return;
    }

    const soundName = getSoundscapeSoundName(soundId);
    let next = [...tracks, toTrack({ id: soundId, name: soundName, volume: 50, category })];

    next = enforceSingleInstanceCategories(
      next.map((t) => ({ id: t.id, name: t.name, volume: t.volume, category: t.category }))
    )
      .map((s) => toTrack(s))
      .filter(Boolean);

    if (next.length > MAX_TRACKS) {
      next = next.slice(-MAX_TRACKS);
    }

    set({ tracks: next });

    get().persistTracks();
    get().playSession({ userGesture: true, syncOnly: true });
  },

  /** @param {string} trackId */
  removeTrack(trackId) {
    const { tracks, soloTrackId } = get();
    const next = tracks.filter((t) => t.id !== trackId);
    set({
      tracks: next,
      soloTrackId: soloTrackId === trackId ? null : soloTrackId,
    });
    get().persistTracks();
  },

  /**
   * @param {string} trackId
   * @param {number} volume
   */
  setTrackVolume(trackId, volume) {
    const clamped = Math.max(0, Math.min(100, volume));
    const { tracks, masterVolume } = get();

    if (clamped > 0 && masterVolume === 0) {
      get().setMasterVolume(get().previousMasterVolume > 0 ? get().previousMasterVolume : 75);
    }

    set({
      tracks: tracks.map((t) => (t.id === trackId ? { ...t, volume: clamped } : t)),
    });
  },

  commitTrackVolume(trackId) {
    get().persistTracks();
    if (!get().sessionPlaying && get().tracks.some((t) => t.volume > 0)) {
      get().playSession({ userGesture: true, syncOnly: true });
    }
  },

  /** @param {string} trackId */
  toggleTrackMute(trackId) {
    const { tracks, previousTrackVolumes } = get();
    const track = tracks.find((t) => t.id === trackId);
    if (!track) return;

    if (track.volume === 0) {
      const restored = previousTrackVolumes[trackId] ?? 50;
      const nextPrev = { ...previousTrackVolumes };
      delete nextPrev[trackId];
      set({
        previousTrackVolumes: nextPrev,
        tracks: tracks.map((t) => (t.id === trackId ? { ...t, volume: restored } : t)),
      });
    } else {
      set({
        previousTrackVolumes: { ...previousTrackVolumes, [trackId]: track.volume },
        tracks: tracks.map((t) => (t.id === trackId ? { ...t, volume: 0 } : t)),
      });
    }
    get().persistTracks();
    if (!get().sessionPlaying) {
      get().playSession({ userGesture: true, syncOnly: true });
    }
  },

  /** @param {string} trackId */
  toggleTrackPlay(trackId) {
    const { tracks, sessionPlaying } = get();
    if (!sessionPlaying) {
      set({
        tracks: tracks.map((t) => (t.id === trackId ? { ...t, playing: true } : t)),
      });
      get().playSession({ userGesture: true });
      return;
    }
    set({
      tracks: tracks.map((t) =>
        t.id === trackId ? { ...t, playing: !t.playing } : t
      ),
    });
  },

  /** @param {string} trackId */
  toggleSolo(trackId) {
    const { soloTrackId } = get();
    set({ soloTrackId: soloTrackId === trackId ? null : trackId });
  },

  /**
   * @param {object[]} sounds
   * @param {number} [globalVolume]
   */
  applyRecipe(sounds, globalVolume) {
    const normalized = enforceSingleInstanceCategories(
      sounds.map((s) => normalizeActiveSound(s)).filter(Boolean)
    ).slice(0, MAX_TRACKS);

    const tracks = normalized.map((s) => toTrack(s)).filter(Boolean);
    const updates = { tracks, soloTrackId: null };

    if (typeof globalVolume === 'number') {
      updates.masterVolume = Math.max(0, Math.min(100, globalVolume));
    }

    const spacesSound = sounds.find((s) => s.id === 'spaces');
    const spacesInRecipe = Boolean(spacesSound);
    if (spacesSound?.volume != null) {
      updates.spacesVolume = Math.max(0, Math.min(100, spacesSound.volume));
    }
    updates.spacesPaused = !spacesInRecipe;

    set(updates);
    get().persistTracks();
    if (updates.masterVolume != null && get().userId) {
      persistMasterVolume(get().userId, updates.masterVolume);
    }
    if (spacesSound && get().userId) {
      persistSpacesVolume(get().userId, updates.spacesVolume);
    }
    if (get().userId) {
      setSpacesUserMuted(get().userId, !spacesInRecipe);
    }
    get().playSession({ userGesture: true, bootstrapSpaces: spacesInRecipe });
  },

  /**
   * @param {object} [options]
   * @param {boolean} [options.userGesture]
   * @param {boolean} [options.immediate]
   * @param {boolean} [options.syncOnly]
   * @param {boolean} [options.bootstrapSpaces]
   */
  async playSession(options = {}) {
    const { userId, spacesVolume, masterVolume } = get();
    const bootstrapSpaces = Boolean(options.bootstrapSpaces);
    set({ sessionPlaying: true, autoplayBlocked: false });

    if (bootstrapSpaces) {
      set({ spacesPaused: false });
      if (userId) setSpacesUserMuted(userId, false);
    }

    if (userId) {
      persistSessionPlaying(userId, true, {
        bootstrapSpaces,
        immediate: options.immediate,
        syncOnly: options.syncOnly,
      });
    }

    if (bootstrapSpaces && spacesVolume > 0 && userId) {
      activateSpacesAudio(userId, masterVolume);
    }
  },

  pauseSession() {
    const { userId } = get();
    set({ sessionPlaying: false });
    if (userId) {
      persistSessionPlaying(userId, false);
    }
  },

  toggleSession() {
    if (get().sessionPlaying) {
      get().pauseSession();
    } else {
      const { userId } = get();
      const bootstrapSpaces = userId ? shouldBootstrapSpacesOnPlay(userId) : false;
      get().playSession({ userGesture: true, bootstrapSpaces, immediate: true });
    }
  },

  persistTracks() {
    const { userId, tracks } = get();
    if (userId) persistTracks(userId, tracks);
  },

  /** Snapshot for recipe saving */
  getRecipeDraft() {
    const { tracks, masterVolume, spacesVolume, spacesPaused } = get();
    const sounds = tracks.map(({ id, volume, category }) => ({ id, volume, category }));
    if (!spacesPaused && spacesVolume > 0) {
      sounds.push({ id: 'spaces', volume: spacesVolume, category: 'Atmosphere' });
    }
    return { sounds, globalVolume: masterVolume };
  },
}));

export function getLibraryTabSounds(tab) {
  return SOUNDSCAPE_LIBRARY[tab] || [];
}
