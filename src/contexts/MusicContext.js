'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserStorageItem, setUserStorageItem } from '@/utils/userStorage';

const MusicContext = createContext();

export function MusicProvider({ children }) {
  const { user } = useUser();
  const userId = user?.id || null;
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  // Initialize audio element once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      const audio = new Audio('/rain.mp3');
      audio.loop = true; // Enable looping
      audio.preload = 'metadata';
      audioRef.current = audio;
    }

    const audio = audioRef.current;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (audio.duration) {
        setDuration(audio.duration);
      }
    };
    const handleEnded = () => {
      // With loop enabled, this shouldn't fire, but handle it just in case
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    // Set initial volume
    audio.volume = isMuted ? 0 : volume;

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  // Update volume when it changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Persist play state across page navigation
  useEffect(() => {
    if (typeof window === 'undefined' || !audioRef.current) return;
    
    const audio = audioRef.current;
    const savedState = getUserStorageItem(userId, 'music-playing-state', 'music-playing-state');
    
    // Wait for audio to be ready before restoring play state
    const restorePlayState = () => {
      if (savedState === 'true') {
        audio.play().catch(() => {
          // Auto-play might be blocked, that's okay
        });
        setIsPlaying(true);
      }
    };

    if (audio.readyState >= 2) {
      // Audio metadata is already loaded
      restorePlayState();
    } else {
      // Wait for metadata to load
      audio.addEventListener('loadedmetadata', restorePlayState, { once: true });
      return () => {
        audio.removeEventListener('loadedmetadata', restorePlayState);
      };
    }
  }, [userId]);

  // Save play state to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setUserStorageItem(userId, 'music-playing-state', isPlaying.toString());
  }, [isPlaying, userId]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch((error) => {
        console.error('Error playing audio:', error);
      });
    }
    setIsPlaying(!isPlaying);
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
    setCurrentTime(audio.currentTime);
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(duration, audio.currentTime + 10);
    setCurrentTime(audio.currentTime);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const setVolumeLevel = (newVolume) => {
    setVolume(Math.max(0, Math.min(1, newVolume)));
    if (newVolume > 0) {
      setIsMuted(false);
    }
  };

  return (
    <MusicContext.Provider value={{
      isPlaying,
      currentTime,
      duration,
      volume,
      isMuted,
      togglePlayPause,
      skipBackward,
      skipForward,
      toggleMute,
      setVolume: setVolumeLevel,
      audioRef, // Expose ref for components that need direct access
    }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within MusicProvider');
  }
  return context;
}

