'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const FocusContext = createContext();

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

