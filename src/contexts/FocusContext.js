'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserStorageItem, getUserStorageJson, removeUserStorageItem, setUserStorageItem, setUserStorageJson } from '@/utils/userStorage';
import { DEFAULT_SPACES_VIDEO_ID, DEFAULT_SPACES_VOLUME, resolveSpacesVideoId } from '@/lib/spacesConstants';
import { ensureSpacesStorageDefaults } from '@/lib/spacesPlayback';

export const FocusContext = createContext(null);

export function FocusProvider({ children }) {
  const { user } = useUser();
  const userId = user?.id || null;

  // Load saved widget states from localStorage, default to all active
  const loadWidgetState = (key, defaultValue = true) => {
    if (typeof window === 'undefined') return defaultValue;
    const storageKey = `focus-widget-${key}`;
    const saved = getUserStorageJson(userId, storageKey, storageKey);
    return saved !== null ? saved : defaultValue;
  };

  const saveWidgetState = (key, value) => {
    const storageKey = `focus-widget-${key}`;
    setUserStorageJson(userId, storageKey, value);
  };

  const [showTimer, setShowTimer] = useState(() => loadWidgetState('timer', true));
  const [showMusic, setShowMusic] = useState(() => loadWidgetState('music', true));
  const [showTask, setShowTask] = useState(() => loadWidgetState('task', true));
  const [showTaskBar, setShowTaskBar] = useState(() => loadWidgetState('taskBar', true));
  const [backgroundVideoId, setBackgroundVideoId] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_SPACES_VIDEO_ID;
    const saved = getUserStorageItem(userId, 'focus-background-video-id', 'focus-background-video-id');
    return resolveSpacesVideoId(saved);
  });

  const [volume, setVolumeState] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_SPACES_VOLUME;
    const saved = getUserStorageItem(userId, 'focus-video-volume', 'focus-video-volume');
    if (saved == null || saved === '') return DEFAULT_SPACES_VOLUME;
    const parsed = parseInt(saved, 10);
    return Number.isNaN(parsed) ? DEFAULT_SPACES_VOLUME : Math.max(0, Math.min(100, parsed));
  });

  // Save widget states to localStorage when they change
  useEffect(() => {
    saveWidgetState('timer', showTimer);
  }, [showTimer, userId]);

  useEffect(() => {
    saveWidgetState('music', showMusic);
  }, [showMusic, userId]);

  useEffect(() => {
    saveWidgetState('task', showTask);
  }, [showTask, userId]);

  useEffect(() => {
    saveWidgetState('taskBar', showTaskBar);
  }, [showTaskBar, userId]);

  useEffect(() => {
    if (backgroundVideoId) {
      setUserStorageItem(userId, 'focus-background-video-id', backgroundVideoId);
    } else {
      removeUserStorageItem(userId, 'focus-background-video-id');
    }
  }, [backgroundVideoId, userId]);

  useEffect(() => {
    setUserStorageItem(userId, 'focus-video-volume', volume.toString());
  }, [volume, userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e) => {
      if (e.detail?.playbackOnly) return;
      if (typeof e.detail?.volume !== 'number' || Number.isNaN(e.detail.volume)) return;
      setVolumeState(Math.max(0, Math.min(100, e.detail.volume)));
    };
    window.addEventListener('focus-volume-changed', handler);
    return () => window.removeEventListener('focus-volume-changed', handler);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (userId) ensureSpacesStorageDefaults(userId);
    setShowTimer(loadWidgetState('timer', true));
    setShowMusic(loadWidgetState('music', true));
    setShowTask(loadWidgetState('task', true));
    setShowTaskBar(loadWidgetState('taskBar', true));
    const savedVideoId = getUserStorageItem(userId, 'focus-background-video-id', 'focus-background-video-id');
    setBackgroundVideoId(resolveSpacesVideoId(savedVideoId));
    const savedVolume = getUserStorageItem(userId, 'focus-video-volume', 'focus-video-volume');
    const parsed =
      savedVolume == null || savedVolume === ''
        ? DEFAULT_SPACES_VOLUME
        : parseInt(savedVolume, 10);
    setVolumeState(Number.isNaN(parsed) ? DEFAULT_SPACES_VOLUME : Math.max(0, Math.min(100, parsed)));
  }, [userId]);

  const setVolume = (next) => {
    setVolumeState((prev) => {
      const value = Math.max(0, Math.min(100, next));
      return value === prev ? prev : value;
    });
  };

  const toggleTimer = () => {
    setShowTimer(prev => !prev);
    if (!showTimer) {
      setShowTaskBar(true);
    }
  };

  const toggleMusic = () => {
    setShowMusic(prev => !prev);
  };

  const toggleTask = () => {
    setShowTask(prev => !prev);
  };

  return (
    <FocusContext.Provider value={{
      showTimer,
      showMusic,
      showTask,
      showTaskBar,
      setShowTimer,
      setShowMusic,
      setShowTask,
      setShowTaskBar,
      toggleTimer,
      toggleMusic,
      toggleTask,
      backgroundVideoId,
      setBackgroundVideoId,
      volume,
      setVolume,
    }}>
      {children}
    </FocusContext.Provider>
  );
}

export function useFocus() {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocus must be used within FocusProvider');
  }
  return context;
}

