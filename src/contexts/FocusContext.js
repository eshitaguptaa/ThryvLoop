'use client';

import { createContext, useContext, useState, useEffect } from 'react';

export const FocusContext = createContext(null);

export function FocusProvider({ children }) {
  // Load saved widget states from localStorage, default to all active
  const loadWidgetState = (key, defaultValue = true) => {
    if (typeof window === 'undefined') return defaultValue;
    const saved = localStorage.getItem(`focus-widget-${key}`);
    return saved !== null ? JSON.parse(saved) : defaultValue;
  };

  const saveWidgetState = (key, value) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`focus-widget-${key}`, JSON.stringify(value));
    }
  };

  const [showTimer, setShowTimer] = useState(() => loadWidgetState('timer', true));
  const [showMusic, setShowMusic] = useState(() => loadWidgetState('music', true));
  const [showTask, setShowTask] = useState(() => loadWidgetState('task', true));
  const [showTaskBar, setShowTaskBar] = useState(() => loadWidgetState('taskBar', true));
  const [backgroundVideoId, setBackgroundVideoId] = useState(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('focus-background-video-id');
    return saved || null;
  });

  const [volume, setVolume] = useState(() => {
    if (typeof window === 'undefined') return 50;
    const saved = localStorage.getItem('focus-video-volume');
    return saved ? parseInt(saved) : 50;
  });

  // Save widget states to localStorage when they change
  useEffect(() => {
    saveWidgetState('timer', showTimer);
  }, [showTimer]);

  useEffect(() => {
    saveWidgetState('music', showMusic);
  }, [showMusic]);

  useEffect(() => {
    saveWidgetState('task', showTask);
  }, [showTask]);

  useEffect(() => {
    saveWidgetState('taskBar', showTaskBar);
  }, [showTaskBar]);

  useEffect(() => {
    if (backgroundVideoId) {
      localStorage.setItem('focus-background-video-id', backgroundVideoId);
    } else {
      localStorage.removeItem('focus-background-video-id');
    }
  }, [backgroundVideoId]);

  useEffect(() => {
    localStorage.setItem('focus-video-volume', volume.toString());
  }, [volume]);

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

