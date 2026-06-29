'use client';

import { useEffect, useMemo, useRef } from 'react';
import { soundscapeAudioManager } from '@/lib/soundscape/audioManager';
import {
  loadPersistedTracks,
  loadSpacesPaused,
  persistSessionPlaying,
} from '@/lib/soundscape/persistence';
import { resumeSoundscapeFromUserGesture } from '@/lib/soundscapeGesturePlay';
import {
  activateSpacesAudio,
  shouldBootstrapSpacesOnPlay,
} from '@/lib/soundscape/spacesPlaybackPolicy';
import { readGlobalVolume } from '@/lib/soundscapePlaybackState';
import { useSoundscapeStore } from '@/stores/soundscapeStore';

/**
 * Bridges Zustand state to the audio manager. Mount once via SoundscapeEngineProvider.
 */
export function useSoundscapeEngine(userId) {
  const hydrated = useSoundscapeStore((s) => s.hydrated);
  const tracks = useSoundscapeStore((s) => s.tracks);
  const masterVolume = useSoundscapeStore((s) => s.masterVolume);
  const sessionPlaying = useSoundscapeStore((s) => s.sessionPlaying);
  const soloTrackId = useSoundscapeStore((s) => s.soloTrackId);
  const setTrackLoadState = useSoundscapeStore((s) => s.setTrackLoadState);
  const setAutoplayBlocked = useSoundscapeStore((s) => s.setAutoplayBlocked);

  const playPauseTokenRef = useRef(0);
  const userIdRef = useRef(userId);
  const prevTrackIdsRef = useRef('');

  const playbackKey = useMemo(
    () =>
      `${sessionPlaying}|${soloTrackId ?? ''}|${tracks
        .map((t) => `${t.id}:${t.playing}`)
        .join(',')}`,
    [sessionPlaying, soloTrackId, tracks]
  );

  const volumeKey = useMemo(
    () =>
      `${masterVolume}|${soloTrackId ?? ''}|${tracks
        .map((t) => `${t.id}:${t.volume}`)
        .join(',')}`,
    [masterVolume, soloTrackId, tracks]
  );

  useEffect(() => {
    userIdRef.current = userId;
    if (!userId) {
      useSoundscapeStore.getState().reset();
      soundscapeAudioManager.destroyAll();
      return;
    }
    useSoundscapeStore.getState().hydrate(userId);
  }, [userId]);

  // Remove audio elements for deleted tracks
  useEffect(() => {
    if (!hydrated) return;
    const ids = tracks.map((t) => t.id).sort().join(',');
    const prev = prevTrackIdsRef.current;
    if (prev) {
      const prevIds = prev.split(',').filter(Boolean);
      const nextIds = new Set(tracks.map((t) => t.id));
      prevIds.forEach((id) => {
        if (!nextIds.has(id)) soundscapeAudioManager.removeTrack(id);
      });
    }
    prevTrackIdsRef.current = ids;
  }, [hydrated, tracks]);

  // Sync load states
  useEffect(() => {
    if (!hydrated) return;
    tracks.forEach((track) => {
      soundscapeAudioManager.ensureTrack(track.id);
      const loadState = soundscapeAudioManager.getLoadState(track.id);
      if (loadState !== track.loadState) {
        setTrackLoadState(track.id, loadState);
      }
    });
  }, [hydrated, tracks, setTrackLoadState]);

  // Play/pause — keyed on track presence & playing flags, not volume
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;

    const token = ++playPauseTokenRef.current;

    const run = async () => {
      if (!sessionPlaying) {
        soundscapeAudioManager.pauseAll();
        return;
      }

      const audibleTracks = tracks.filter((t) => t.playing && t.volume > 0);
      soundscapeAudioManager.warmMix(audibleTracks);

      if (audibleTracks.length === 0) {
        return;
      }

      const result = await soundscapeAudioManager.playMix(
        audibleTracks,
        masterVolume,
        soloTrackId,
        { immediate: false }
      );

      if (token !== playPauseTokenRef.current) return;

      setAutoplayBlocked(result.autoplayBlocked);

      audibleTracks.forEach((track) => {
        setTrackLoadState(track.id, soundscapeAudioManager.getLoadState(track.id));
      });
    };

    void run();

    return () => {
      playPauseTokenRef.current += 1;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- volumeKey intentionally excluded
  }, [hydrated, playbackKey, masterVolume, soloTrackId, setAutoplayBlocked, setTrackLoadState]);

  // Volume updates without re-starting playback
  useEffect(() => {
    if (!hydrated || !sessionPlaying) return;
    soundscapeAudioManager.syncVolumes(
      tracks.filter((t) => t.playing),
      masterVolume,
      soloTrackId
    );
  }, [hydrated, sessionPlaying, volumeKey, tracks, masterVolume, soloTrackId]);

  // External play/pause from MusicWidget / home card
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;

    const onExternalToggle = (event) => {
      const detail = event?.detail;
      if (detail?.syncOnly) return;

      const playing = detail?.isPlaying;
      if (playing === true) {
        const persisted = loadPersistedTracks(userId);
        const bootstrapSpaces =
          detail?.bootstrapSpaces === true || shouldBootstrapSpacesOnPlay(userId);

        if (persisted.length > 0) {
          useSoundscapeStore.setState({
            tracks: persisted.map((s) => ({
              id: s.id,
              name: s.name,
              volume: s.volume,
              category: s.category,
              playing: true,
              loadState: 'idle',
            })),
          });
        }

        useSoundscapeStore.setState({
          sessionPlaying: true,
          autoplayBlocked: false,
          spacesPaused: bootstrapSpaces ? false : loadSpacesPaused(userId),
        });

        if (detail?.immediate) {
          resumeSoundscapeFromUserGesture(userId);
          if (bootstrapSpaces) {
            activateSpacesAudio(userId, readGlobalVolume(userId));
          }
        }
      } else if (playing === false) {
        useSoundscapeStore.setState({ sessionPlaying: false });
        soundscapeAudioManager.pauseAll();
      }
    };

    const onStopAll = () => {
      useSoundscapeStore.getState().pauseSession();
      soundscapeAudioManager.pauseAll();
    };

    window.addEventListener('soundscape-play-pause-changed', onExternalToggle);
    window.addEventListener('soundscape-stop-all', onStopAll);

    return () => {
      window.removeEventListener('soundscape-play-pause-changed', onExternalToggle);
      window.removeEventListener('soundscape-stop-all', onStopAll);
    };
  }, [userId]);

  useEffect(() => {
    return () => {
      if (!userIdRef.current) {
        soundscapeAudioManager.destroyAll();
      }
    };
  }, []);
}

/** Call from a user gesture when autoplay was blocked. */
export function unlockSoundscapePlayback(userId) {
  if (!userId) return;
  const bootstrapSpaces = shouldBootstrapSpacesOnPlay(userId);
  resumeSoundscapeFromUserGesture(userId);
  useSoundscapeStore.setState({
    sessionPlaying: true,
    autoplayBlocked: false,
    spacesPaused: !bootstrapSpaces,
  });
  persistSessionPlaying(userId, true, {
    immediate: true,
    bootstrapSpaces,
  });
}
