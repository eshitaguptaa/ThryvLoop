'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  closeSpacesPip,
  getSpacesPipMode,
  isSpacesPipAvailable,
  openSpacesPip,
} from '@/lib/spacesPip';

/**
 * Spaces PiP — opens only when the browser tab is hidden, closes when the tab is visible again.
 * Never primes or shows PiP while the user is in the app (including on Focus).
 */
export function useSpacesPictureInPicture({
  enabled,
  spaceLabel,
  shouldShowPip,
  getPipPlaybackSnapshot,
}) {
  const pathname = usePathname();
  const [pipActive, setPipActive] = useState(false);
  const [pipLabel, setPipLabel] = useState(spaceLabel || 'Spaces');
  const pipOpenRef = useRef(false);
  const openingRef = useRef(false);
  const isOnFocusRoute = pathname?.startsWith('/focus');
  const isMeetRoom = pathname?.startsWith('/meet');

  const shouldShowPipRef = useRef(shouldShowPip);
  const getPipPlaybackSnapshotRef = useRef(getPipPlaybackSnapshot);
  const pipLabelRef = useRef(pipLabel);
  shouldShowPipRef.current = shouldShowPip;
  getPipPlaybackSnapshotRef.current = getPipPlaybackSnapshot;
  pipLabelRef.current = pipLabel;

  useEffect(() => {
    setPipLabel(spaceLabel || 'Spaces');
  }, [spaceLabel]);

  const closePip = useCallback(() => {
    closeSpacesPip();
    pipOpenRef.current = false;
    openingRef.current = false;
    setPipActive(false);
  }, []);

  const openPipForHiddenTab = useCallback(async () => {
    if (!enabled || !shouldShowPipRef.current()) return;
    if (isMeetRoom) return;
    if (!isSpacesPipAvailable()) return;
    if (pipOpenRef.current || openingRef.current) return;
    if (document.visibilityState === 'visible') return;

    const snapshot = getPipPlaybackSnapshotRef.current?.() ?? {};
    if (!snapshot.videoId) return;

    openingRef.current = true;
    const opened = await openSpacesPip({
      videoId: snapshot.videoId,
      label: pipLabelRef.current,
      onClose: () => {
        pipOpenRef.current = false;
        openingRef.current = false;
        setPipActive(false);
      },
    });
    openingRef.current = false;

    if (opened) {
      pipOpenRef.current = true;
      setPipActive(true);
    }
  }, [enabled, isMeetRoom]);

  const handleVisibilityChange = useCallback(() => {
    const tabVisible = document.visibilityState === 'visible';

    if (tabVisible) {
      if (pipOpenRef.current) closePip();
      return;
    }

    if (!enabled || !shouldShowPipRef.current()) return;
    void openPipForHiddenTab();
  }, [closePip, enabled, openPipForHiddenTab]);

  useEffect(() => {
    if (!enabled && pipOpenRef.current) {
      closePip();
    }
  }, [closePip, enabled]);

  useEffect(() => {
    if (!isOnFocusRoute && pipOpenRef.current) {
      closePip();
    }
  }, [closePip, isOnFocusRoute]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleVisibilityChange]);

  useEffect(() => {
    const onPipChanged = () => {
      const mode = getSpacesPipMode();
      pipOpenRef.current = mode !== 'idle';
      if (mode === 'idle') setPipActive(false);
    };
    window.addEventListener('spaces-pip-changed', onPipChanged);
    return () => window.removeEventListener('spaces-pip-changed', onPipChanged);
  }, []);

  useEffect(() => {
    const refresh = () => {
      if (!shouldShowPipRef.current()) {
        if (pipOpenRef.current) closePip();
        return;
      }
      if (document.visibilityState === 'hidden' && !pipOpenRef.current && enabled) {
        void openPipForHiddenTab();
      }
    };
    window.addEventListener('soundscape-state-changed', refresh);
    window.addEventListener('soundscape-play-pause-changed', refresh);
    window.addEventListener('focus-volume-changed', refresh);
    window.addEventListener('focus-spaces-pause-changed', refresh);
    return () => {
      window.removeEventListener('soundscape-state-changed', refresh);
      window.removeEventListener('soundscape-play-pause-changed', refresh);
      window.removeEventListener('focus-volume-changed', refresh);
      window.removeEventListener('focus-spaces-pause-changed', refresh);
    };
  }, [closePip, enabled, openPipForHiddenTab]);

  useEffect(() => () => closeSpacesPip(), []);

  return {
    pipActive,
    pipLabel,
  };
}
