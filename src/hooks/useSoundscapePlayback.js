'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  openSoundscapeComposer,
  readSoundscapeSnapshot,
  toggleSoundscapePlayPause,
  withDisplayNames,
} from '@/lib/soundscapePlaybackState';

const SYNC_MS = 500;

/**
 * Shared soundscape UI state for MusicWidget, home card, etc.
 * Stays in sync with SoundscapeComposer via storage + window events.
 */
export function useSoundscapePlayback(userId) {
  const [snapshot, setSnapshot] = useState(() => readSoundscapeSnapshot(userId));

  const refresh = useCallback(() => {
    if (!userId) return;
    setSnapshot(readSoundscapeSnapshot(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setSnapshot(readSoundscapeSnapshot(null));
      return;
    }

    refresh();

    const onChange = () => refresh();

    window.addEventListener('soundscape-play-pause-changed', onChange);
    window.addEventListener('soundscape-state-changed', onChange);
    window.addEventListener('focus-volume-changed', onChange);
    window.addEventListener('soundscape-stop-all', onChange);
    window.addEventListener('focus-spaces-activate', onChange);
    window.addEventListener('focus-spaces-resume', onChange);
    window.addEventListener('focus-spaces-pause-changed', onChange);

    const interval = setInterval(refresh, SYNC_MS);

    return () => {
      clearInterval(interval);
      window.removeEventListener('soundscape-play-pause-changed', onChange);
      window.removeEventListener('soundscape-state-changed', onChange);
      window.removeEventListener('focus-volume-changed', onChange);
      window.removeEventListener('soundscape-stop-all', onChange);
      window.removeEventListener('focus-spaces-activate', onChange);
      window.removeEventListener('focus-spaces-resume', onChange);
      window.removeEventListener('focus-spaces-pause-changed', onChange);
    };
  }, [userId, refresh]);

  const displaySounds = useMemo(
    () => withDisplayNames(snapshot.activeSounds),
    [snapshot.activeSounds]
  );

  const composerSounds = useMemo(
    () => displaySounds.filter((s) => s.id !== 'spaces'),
    [displaySounds]
  );

  const togglePlayPause = useCallback(() => {
    if (!userId) return;
    toggleSoundscapePlayPause(userId, snapshot);
    refresh();
  }, [userId, snapshot, refresh]);

  const openComposer = useCallback(() => {
    openSoundscapeComposer();
  }, []);

  return {
    activeSounds: snapshot.activeSounds,
    displaySounds,
    composerSounds,
    isPlaying: snapshot.isPlaying,
    showAsPlaying: snapshot.showAsPlaying,
    spacesPaused: snapshot.spacesPaused,
    spacesActive: snapshot.spacesActive,
    globalVolume: snapshot.globalVolume,
    togglePlayPause,
    openComposer,
    refresh,
  };
}
