'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserStorageItem, getUserStorageJson, removeUserStorageItem, setUserStorageItem, setUserStorageJson } from '@/utils/userStorage';

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
    if (typeof window === 'undefined') return null;
    const saved = getUserStorageItem(userId, 'focus-background-video-id', 'focus-background-video-id');
    return saved || null;
  });

  const [volume, setVolumeState] = useState(() => {
    if (typeof window === 'undefined') return 50;
    const saved = getUserStorageItem(userId, 'focus-video-volume', 'focus-video-volume');
    const parsed = saved ? parseInt(saved, 10) : 50;
    return Number.isNaN(parsed) ? 50 : Math.max(0, Math.min(100, parsed));
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
    setShowTimer(loadWidgetState('timer', true));
    setShowMusic(loadWidgetState('music', true));
    setShowTask(loadWidgetState('task', true));
    setShowTaskBar(loadWidgetState('taskBar', true));
    const savedVideoId = getUserStorageItem(userId, 'focus-background-video-id', 'focus-background-video-id');
    setBackgroundVideoId(savedVideoId || null);
    const savedVolume = getUserStorageItem(userId, 'focus-video-volume', 'focus-video-volume');
    const parsed = savedVolume ? parseInt(savedVolume, 10) : 50;
    setVolumeState(Number.isNaN(parsed) ? 50 : Math.max(0, Math.min(100, parsed)));
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

