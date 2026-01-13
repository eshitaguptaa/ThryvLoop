'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import { FocusContext } from '@/contexts/FocusContext';

export default function SoundscapeComposer({ isOpen, onClose }) {
  const focusContext = useContext(FocusContext);
  
  // Get values from context or localStorage
  const getBackgroundVideoId = () => {
    if (focusContext?.backgroundVideoId !== undefined) {
      return focusContext.backgroundVideoId;
    }
    if (typeof window !== 'undefined') {
      return localStorage.getItem('focus-background-video-id') || null;
    }
    return null;
  };

  const getSpacesVolume = () => {
    if (focusContext?.volume !== undefined) {
      return focusContext.volume;
    }
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('focus-video-volume');
      return saved ? parseInt(saved) : 50;
    }
    return 50;
  };

  const setSpacesVolume = (val) => {
    const newVolume = Math.max(0, Math.min(100, val));
    // Update context if available
    if (focusContext?.setVolume) {
      focusContext.setVolume(newVolume);
    }
    // Always save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('focus-video-volume', newVolume.toString());
      // Dispatch custom event to ensure video player gets the update
      window.dispatchEvent(new CustomEvent('focus-volume-changed', {
        detail: { volume: newVolume }
      }));
    }
  };

  const [activeTab, setActiveTab] = useState('Atmosphere');
  const [globalVolume, setGlobalVolume] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soundscape-global-volume');
      return saved ? parseInt(saved) : 75;
    }
    return 75;
  });
  const [activeSounds, setActiveSounds] = useState([]);
  const [isPlaying, setIsPlaying] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soundscape-is-playing');
      return saved === null ? true : saved === 'true';
    }
    return true;
  });
  const [soloSoundId, setSoloSoundId] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeType, setRecipeType] = useState('bolt');
  const [customRecipes, setCustomRecipes] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);
  
  const audioRefs = useRef({});
  const isUpdatingFromComposerRef = useRef(false);
  const initializedRef = useRef(false);
  const previousVolumesRef = useRef({}); // Store previous volumes when muting individual sounds
  const previousGlobalVolumeRef = useRef(75); // Store previous global volume when muting master
  const soundTimestampsRef = useRef({}); // Track when each sound was added to determine oldest

  // Sound Library - only include sounds that exist in public/sounds
  const soundLibrary = {
    Atmosphere: [
      { id: 'spaces', name: 'Spaces', description: 'Background • Video', isSpaces: true },
      { id: 'rain', name: 'Heavy Rain', description: 'Active' },
      { id: 'fire', name: 'Fire Crackle', description: 'Cozy • Interior' },
      { id: 'forest', name: 'Forest', description: 'Nature • Calm' },
      { id: 'waterfall', name: 'Waterfall', description: 'Flowing • Peaceful' },
    ],
    Neural: [
      { id: 'binaural', name: 'Binaural (40Hz)', description: 'Focus • Theta' },
    ],
    Rhythm: [
      { id: 'lofi', name: 'Chill Lo-Fi', description: 'Relax • Study' },
      { id: 'synthwave', name: 'Synthwave', description: 'Retro • Vibes' },
    ],
  };

  const defaultRecipes = [
    { 
      id: 'deep-dive', 
      name: 'Deep Dive', 
      icon: 'bolt',
      sounds: [
        { id: 'rain', volume: 60, category: 'Atmosphere' },
        { id: 'binaural', volume: 50, category: 'Neural' },
        { id: 'forest', volume: 30, category: 'Atmosphere' },
      ]
    },
    { 
      id: 'code-flow', 
      name: 'Code Flow', 
      icon: 'code',
      sounds: [
        { id: 'lofi', volume: 55, category: 'Rhythm' },
        { id: 'binaural', volume: 45, category: 'Neural' },
        { id: 'fire', volume: 40, category: 'Atmosphere' },
      ]
    },
    { 
      id: 'creative-spark', 
      name: 'Creative Spark', 
      icon: 'pen',
      sounds: [
        { id: 'synthwave', volume: 50, category: 'Rhythm' },
        { id: 'fire', volume: 35, category: 'Atmosphere' },
        { id: 'forest', volume: 30, category: 'Atmosphere' },
      ]
    },
    { 
      id: 'zen-zone', 
      name: 'Zen Zone', 
      icon: 'lotus',
      sounds: [
        { id: 'waterfall', volume: 50, category: 'Atmosphere' },
        { id: 'forest', volume: 40, category: 'Atmosphere' },
        { id: 'binaural', volume: 35, category: 'Neural' },
      ]
    },
    { 
      id: 'office-privacy', 
      name: 'Office Privacy', 
      icon: 'briefcase',
      sounds: [
        { id: 'rain', volume: 45, category: 'Atmosphere' },
        { id: 'fire', volume: 40, category: 'Atmosphere' },
        { id: 'binaural', volume: 30, category: 'Neural' },
      ]
    },
  ];

  // Load custom recipes from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('soundscape-custom-recipes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomRecipes(parsed);
      } catch (e) {
        console.error('Error loading custom recipes:', e);
      }
    }
  }, []);

  // Combine default and custom recipes
  const focusRecipes = [...defaultRecipes, ...customRecipes];

  // Sound file mapping - only sounds that exist
  const soundFileMap = {
    rain: '/sounds/rain.mp3',
    binaural: '/sounds/binaural.mp3',
    lofi: '/sounds/lofi.mp3',
    fire: '/sounds/fire.mp3',
    forest: '/sounds/forest.mp3',
    synthwave: '/sounds/synthwave.mp3',
    waterfall: '/sounds/waterfall.mp3',
  };

  // SoundIcon component
  const SoundIcon = ({ soundId, className = "w-6 h-6" }) => {
    const icons = {
      spaces: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      rain: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 19v-6m4 6v-6m4 6v-6" />
        </svg>
      ),
      fire: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.5-7 1.832 2.09 2 4 2 4s-1.5 2-2.5 4 5 5 7 5c0 2 1 3 1 3s4-1 4-3c0-2-2-4-2-4z" />
        </svg>
      ),
      forest: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      waterfall: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      binaural: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      lofi: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
      synthwave: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
    };
    return icons[soundId] || <div className={className} />;
  };

  // Recipe Icon Component
  const RecipeIcon = ({ recipeId, icon, className = "w-4 h-4" }) => {
    // If icon is provided directly (for custom recipes), use it
    if (icon) {
      const iconMap = {
        'bolt': (
          <svg className={className} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
          </svg>
        ),
        'code': (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        ),
        'pen': (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        ),
        'lotus': (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
        'briefcase': (
          <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
      };
      return iconMap[icon] || iconMap['bolt'];
    }

    // Fallback to recipeId-based lookup for default recipes
    const icons = {
      'deep-dive': (
        <svg className={className} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
        </svg>
      ),
      'code-flow': (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      'creative-spark': (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      'zen-zone': (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      'office-privacy': (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    };
    return icons[recipeId] || <div className={className} />;
  };

  // Helper function to fade out audio smoothly
  const fadeOutAudio = (audio, duration = 500) => {
    return new Promise((resolve) => {
      if (!audio) {
        resolve();
        return;
      }
      
      const startVolume = audio.volume;
      const startTime = Date.now();
      
      const fadeInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        audio.volume = startVolume * (1 - progress);
        
        if (progress >= 1) {
          clearInterval(fadeInterval);
          audio.pause();
          audio.src = '';
          resolve();
        }
      }, 16); // ~60fps
    });
  };

  // Helper function to fade in audio smoothly
  const fadeInAudio = (audio, targetVolume, duration = 500) => {
    if (!audio) return;
    
    audio.volume = 0;
    audio.play().catch(() => {
      // Auto-play might be blocked
    });
    
    const startTime = Date.now();
    
    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      audio.volume = targetVolume * progress;
      
      if (progress >= 1) {
        clearInterval(fadeInterval);
      }
    }, 16); // ~60fps
  };

  // Initialize active sounds on mount - only load sounds that are actually playing
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (initializedRef.current) return;
    
    // Small delay to ensure context is loaded
    const timeoutId = setTimeout(() => {
      if (initializedRef.current) return;
      initializedRef.current = true;
      
      const currentVideoId = getBackgroundVideoId();
      const currentSpacesVolume = getSpacesVolume();
    
      // Only add Spaces if it's actually playing (video exists and volume > 0)
      const spacesIsActive = currentVideoId && currentSpacesVolume > 0;
      
      // Don't load from localStorage - only show what's actually playing
      // This ensures active mixer only shows sounds that are being heard
      const finalSounds = [];
      
      // Add Spaces if it's actually active
      if (spacesIsActive) {
        finalSounds.push({
          id: 'spaces',
          name: 'Spaces',
          volume: currentSpacesVolume,
          category: 'Atmosphere'
        });
        const now = Date.now();
        soundTimestampsRef.current['spaces'] = now;
      }
      
      // Set active sounds (only what's actually playing)
      if (finalSounds.length > 0) {
        setActiveSounds(finalSounds);
      } else {
        // Clear activeSounds if nothing is playing
        setActiveSounds([]);
      }
    }, 100); // Small delay to ensure context is loaded
    
    return () => clearTimeout(timeoutId);
  }, []); // Only run once on mount

  // Listen for volume changes from SpacesDrawer
  useEffect(() => {
    const handleVolumeChange = (e) => {
      // Ignore if we're the one who triggered this event
      if (isUpdatingFromComposerRef.current) {
        return;
      }
      
      const newVolume = e.detail?.volume;
      if (newVolume !== undefined) {
        // Update Spaces volume in activeSounds to match the video player volume
        setActiveSounds(prevSounds => {
          const spacesSound = prevSounds.find(s => s.id === 'spaces');
          if (spacesSound && Math.abs(spacesSound.volume - newVolume) > 0.5) {
            return prevSounds.map(s => 
              s.id === 'spaces' ? { ...s, volume: newVolume } : s
            );
          }
          // If Spaces is not in activeSounds but volume > 0, add it
          if (!spacesSound && newVolume > 0) {
            const currentVideoId = getBackgroundVideoId();
            if (currentVideoId) {
              const now = Date.now();
              soundTimestampsRef.current['spaces'] = now;
              return [...prevSounds, {
                id: 'spaces',
                name: 'Spaces',
                volume: newVolume,
                category: 'Atmosphere'
              }].slice(-3); // Ensure max 3 layers
            }
          }
          // If Spaces is in activeSounds but volume is 0, remove it
          if (spacesSound && newVolume === 0) {
            delete soundTimestampsRef.current['spaces'];
            return prevSounds.filter(s => s.id !== 'spaces');
          }
          return prevSounds;
        });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus-volume-changed', handleVolumeChange);
      return () => {
        window.removeEventListener('focus-volume-changed', handleVolumeChange);
      };
    }
  }, []);

  // Save play/pause state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundscape-is-playing', isPlaying.toString());
    }
  }, [isPlaying]);

  // Listen for play/pause changes from MusicWidget
  useEffect(() => {
    const handlePlayPauseChange = (e) => {
      if (e.detail?.isPlaying !== undefined) {
        setIsPlaying(e.detail.isPlaying);
      }
    };
    
    window.addEventListener('soundscape-play-pause-changed', handlePlayPauseChange);
    
    return () => {
      window.removeEventListener('soundscape-play-pause-changed', handlePlayPauseChange);
    };
  }, []);

  // Initialize and manage audio - keep playing even when modal is closed
  useEffect(() => {
    const currentVideoId = getBackgroundVideoId();
    
    // Start playing active sounds (regardless of modal state)
    activeSounds.forEach((sound) => {
      // Skip Spaces - it's handled by the video player
      if (sound.id === 'spaces') {
        // Ensure Spaces volume is synced
        if (currentVideoId) {
          const currentVolume = getSpacesVolume();
          if (Math.abs(sound.volume - currentVolume) > 0.5) {
            setSpacesVolume(sound.volume);
          }
        }
        return;
      }
      
      if (!audioRefs.current[sound.id] && soundFileMap[sound.id]) {
        const audio = new Audio(soundFileMap[sound.id]);
        audio.loop = true;
        const targetVolume = (sound.volume / 100) * (globalVolume / 100);
        audioRefs.current[sound.id] = audio;
        // Only fade in if playing
        if (isPlaying) {
          fadeInAudio(audio, targetVolume, 500);
        } else {
          audio.volume = targetVolume;
        }
      }
    });

    // Control play/pause for all audio
    Object.keys(audioRefs.current).forEach((soundId) => {
      const audio = audioRefs.current[soundId];
      if (audio) {
        if (isPlaying) {
          if (audio.paused) {
            audio.play().catch(() => {
              // Auto-play might be blocked
            });
          }
        } else {
          audio.pause();
        }
      }
    });

    // Cleanup sounds that are no longer active (with fade out)
    Object.keys(audioRefs.current).forEach(async (soundId) => {
      if (!activeSounds.some((s) => s.id === soundId)) {
        const audio = audioRefs.current[soundId];
        if (audio) {
          await fadeOutAudio(audio, 500);
          delete audioRefs.current[soundId];
          delete soundTimestampsRef.current[soundId];
        }
      }
    });
  }, [activeSounds, globalVolume, isPlaying]); // Added isPlaying dependency

  // Enforce 3-layer limit as a safeguard (runs after any state update)
  useEffect(() => {
    if (activeSounds.length > 3) {
      // Find oldest sounds to remove
      const sortedByAge = [...activeSounds].sort((a, b) => {
        const aTime = soundTimestampsRef.current[a.id] || 0;
        const bTime = soundTimestampsRef.current[b.id] || 0;
        if (aTime > 0 && bTime > 0) return aTime - bTime;
        if (aTime > 0 && bTime === 0) return -1; // a is older
        if (bTime > 0 && aTime === 0) return 1; // b is older
        return 0; // Keep original order if no timestamps
      });
      
      // Keep only the 3 newest sounds
      const toKeep = sortedByAge.slice(-3);
      const toRemove = sortedByAge.slice(0, -3);
      
      // Clean up removed sounds
      toRemove.forEach(sound => {
        delete soundTimestampsRef.current[sound.id];
        if (sound.id === 'spaces') {
          isUpdatingFromComposerRef.current = true;
          setSpacesVolume(0);
          setTimeout(() => {
            isUpdatingFromComposerRef.current = false;
          }, 0);
        } else {
          const audio = audioRefs.current[sound.id];
          if (audio) {
            fadeOutAudio(audio, 500).then(() => {
              delete audioRefs.current[sound.id];
            });
          }
        }
        if (soloSoundId === sound.id) {
          setSoloSoundId(null);
        }
      });
      
      setActiveSounds(toKeep);
    }
  }, [activeSounds.length]); // Only check length to avoid infinite loops

  // Save global volume to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!initializedRef.current) return; // Don't save during initialization
    localStorage.setItem('soundscape-global-volume', globalVolume.toString());
  }, [globalVolume]);

  // Save active sounds to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!initializedRef.current) return; // Don't save during initialization
    
    const currentVideoId = getBackgroundVideoId();
    const soundsToSave = activeSounds.filter(sound => {
      if (sound.id === 'spaces') {
        return !!currentVideoId;
      }
      return true;
    });
    
    localStorage.setItem('soundscape-active-sounds', JSON.stringify(soundsToSave));
  }, [activeSounds]);

  // Update audio volumes when they change
  useEffect(() => {
    // Skip if user is currently updating Spaces volume (prevents circular updates)
    if (isUpdatingFromComposerRef.current) {
      return;
    }
    
    activeSounds.forEach((sound) => {
      // Handle Spaces separately (uses video player volume)
      if (sound.id === 'spaces') {
        // Apply play/pause and solo effect
        let calculatedVolume = sound.volume;
        
        // If paused, mute Spaces
        if (!isPlaying) {
          calculatedVolume = 0;
        } else if (soloSoundId !== null) {
          // Apply solo effect
          calculatedVolume = soloSoundId === 'spaces' ? sound.volume : 0;
        }
        
        // Only update if the calculated volume is different from current
        const currentVolume = getSpacesVolume();
        if (Math.abs(calculatedVolume - currentVolume) > 0.1) {
          isUpdatingFromComposerRef.current = true;
          setSpacesVolume(calculatedVolume);
          setTimeout(() => {
            isUpdatingFromComposerRef.current = false;
          }, 0);
        }
        return;
      }
      
      // Handle regular audio files
      const audio = audioRefs.current[sound.id];
      if (audio) {
        // Control play/pause first
        if (isPlaying) {
          if (audio.paused) {
            audio.play().catch(() => {});
          }
        } else {
          audio.pause();
        }
        
        // Then set volume (only if playing)
        if (isPlaying) {
          // If solo is active, only play the soloed sound, mute others
          if (soloSoundId !== null) {
            if (sound.id === soloSoundId) {
              audio.volume = (sound.volume / 100) * (globalVolume / 100);
            } else {
              audio.volume = 0; // Mute other sounds
            }
          } else {
            // Normal volume when no solo is active
            audio.volume = (sound.volume / 100) * (globalVolume / 100);
          }
        }
      }
    });
  }, [activeSounds, globalVolume, soloSoundId, isPlaying]);

  // Sync active sounds when modal opens - only add sounds that are actually playing, but don't remove existing ones
  useEffect(() => {
    if (!isOpen) return; // Only sync when modal opens
    
    // Skip if we're updating from this component (prevents interference with user actions)
    if (isUpdatingFromComposerRef.current) {
      return;
    }
    
    const currentVideoId = getBackgroundVideoId();
    const currentSpacesVolume = getSpacesVolume();
    
    setActiveSounds(prevSounds => {
      let updated = [...prevSounds]; // Start with existing sounds (don't remove them)
      
      // Add Spaces only if it's actually playing (video exists and volume > 0) and not already in activeSounds
      const hasSpaces = updated.some(s => s.id === 'spaces');
      if (currentVideoId && currentSpacesVolume > 0 && !hasSpaces) {
        const now = Date.now();
        if (!soundTimestampsRef.current['spaces']) {
          soundTimestampsRef.current['spaces'] = now;
        }
        updated.push({
          id: 'spaces',
          name: 'Spaces',
          volume: currentSpacesVolume,
          category: 'Atmosphere'
        });
      }
      
      // Remove Spaces only if video is gone (not just muted)
      if (hasSpaces && !currentVideoId) {
        updated = updated.filter(s => s.id !== 'spaces');
        delete soundTimestampsRef.current['spaces'];
      }
      
      // Don't remove regular sounds - they should stay in activeSounds even if muted by solo
      // The playableSounds filter will handle visibility, but activeSounds should preserve all sounds
      
      // Ensure we don't exceed 3 layers
      if (updated.length > 3) {
        // Sort by timestamp and keep newest 3
        updated.sort((a, b) => {
          const aTime = soundTimestampsRef.current[a.id] || 0;
          const bTime = soundTimestampsRef.current[b.id] || 0;
          return bTime - aTime; // Newest first
        });
        updated = updated.slice(0, 3);
      }
      
      return updated;
    });
  }, [isOpen]); // Only sync when modal opens

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSoundClick = (soundId, category) => {
    const isActive = activeSounds.some((s) => s.id === soundId);
    const currentVideoId = getBackgroundVideoId();
    
    // Special handling for Spaces
    if (soundId === 'spaces') {
      if (!currentVideoId) {
        return; // Can't add Spaces if no video is selected
      }
      
      if (isActive) {
        // Remove Spaces - mute the video player
        if (soloSoundId === 'spaces') {
          setSoloSoundId(null);
        }
        // Update UI immediately
        setActiveSounds(activeSounds.filter((s) => s.id !== 'spaces'));
        // Clean up timestamp
        delete soundTimestampsRef.current['spaces'];
        // Mark that we're updating from composer and set volume to 0
        isUpdatingFromComposerRef.current = true;
        setSpacesVolume(0);
        // Reset flag in background
        setTimeout(() => {
          isUpdatingFromComposerRef.current = false;
        }, 0);
      } else {
        // Add Spaces if video is available
        const currentVolume = getSpacesVolume();
        const volumeToUse = currentVolume > 0 ? currentVolume : 50;
        
        // Mark that we're updating from composer to prevent sync interference
        isUpdatingFromComposerRef.current = true;
        
        // Check if we need to remove the oldest sound to stay within 3 layers
        let soundsToRemove = [];
        if (activeSounds.length >= 3) {
          // Find the oldest sound by timestamp
          const oldestSound = activeSounds.reduce((oldest, current) => {
            const oldestTime = soundTimestampsRef.current[oldest.id] || 0;
            const currentTime = soundTimestampsRef.current[current.id] || 0;
            if (oldestTime > 0 && currentTime > 0) {
              return oldestTime < currentTime ? oldest : current;
            }
            if (oldestTime > 0 && currentTime === 0) return current;
            if (currentTime > 0 && oldestTime === 0) return oldest;
            return oldest; // Use array order if no timestamps
          });
          soundsToRemove.push(oldestSound);
        }
        
        // Update UI immediately - remove sounds from state
        const remainingSounds = activeSounds.filter(s => !soundsToRemove.some(r => r.id === s.id));
        const now = Date.now();
        soundTimestampsRef.current['spaces'] = now;
        
        // Final safeguard: ensure we never exceed 3 sounds
        const newSoundsArray = [...remainingSounds, { 
          id: 'spaces', 
          name: 'Spaces', 
          volume: volumeToUse, 
          category: 'Atmosphere' 
        }];
        const finalSounds = newSoundsArray.length > 3 
          ? newSoundsArray.slice(-3) // Keep only the last 3 (newest)
          : newSoundsArray;
        
        // If we had to trim, remove timestamps for trimmed sounds
        if (newSoundsArray.length > 3) {
          const trimmedIds = newSoundsArray.slice(0, -3).map(s => s.id);
          trimmedIds.forEach(id => {
            delete soundTimestampsRef.current[id];
            // Also fade out and clean up audio for trimmed sounds
            if (id !== 'spaces') {
              const audio = audioRefs.current[id];
              if (audio) {
                fadeOutAudio(audio, 500).then(() => {
                  delete audioRefs.current[id];
                });
              }
            }
          });
        }
        
        setActiveSounds(finalSounds);
        
        // Handle solo state immediately
        soundsToRemove.forEach(soundToRemove => {
          if (soloSoundId === soundToRemove.id) {
            setSoloSoundId(null);
          }
        });
        
        // Restore Spaces volume immediately
        setSpacesVolume(volumeToUse);
        
        // Fade out removed sounds in background (non-blocking)
        soundsToRemove.forEach(soundToRemove => {
          if (soundToRemove.id === 'spaces') {
            // Already handled above
          } else {
            const audio = audioRefs.current[soundToRemove.id];
            if (audio) {
              fadeOutAudio(audio, 500).then(() => {
                delete audioRefs.current[soundToRemove.id];
              });
            }
          }
        });
        
        // Reset flag in background
        setTimeout(() => {
          isUpdatingFromComposerRef.current = false;
        }, 0);
      }
      return;
    }
    
    if (isActive) {
      // Update UI immediately - remove from active sounds
      setActiveSounds(activeSounds.filter((s) => s.id !== soundId));
      if (soloSoundId === soundId) {
        setSoloSoundId(null);
      }
      // Clean up timestamp
      delete soundTimestampsRef.current[soundId];
      // Fade out audio in background (non-blocking)
      const audio = audioRefs.current[soundId];
      if (audio) {
        fadeOutAudio(audio, 500).then(() => {
          delete audioRefs.current[soundId];
        });
      }
    } else {
      const soundName = soundLibrary[category]?.find(s => s.id === soundId)?.name || soundId;
      
      // Rhythm Rule: Only ONE "Rhythm" type sound allowed at a time
      const isRhythmSound = category === 'Rhythm';
      let soundsToRemove = [];
      
      if (isRhythmSound) {
        // Find existing Rhythm sounds
        const existingRhythm = activeSounds.filter(s => s.category === 'Rhythm');
        soundsToRemove = existingRhythm;
      }
      
      // Max 3 Layers: Always ensure we have room for the new sound
      // After removing rhythm sounds, if we still have 3 or more, remove the oldest
      const remainingAfterRhythm = activeSounds.filter(s => !soundsToRemove.some(r => r.id === s.id));
      if (remainingAfterRhythm.length >= 3) {
        // Find the oldest sound that's not already being removed
        const soundsToConsider = remainingAfterRhythm;
        if (soundsToConsider.length > 0) {
          // Find the sound with the oldest timestamp (or first in array if no timestamp)
          const oldestSound = soundsToConsider.reduce((oldest, current) => {
            const oldestTime = soundTimestampsRef.current[oldest.id] || 0;
            const currentTime = soundTimestampsRef.current[current.id] || 0;
            // If both have timestamps, use the older one; otherwise use array order
            if (oldestTime > 0 && currentTime > 0) {
              return oldestTime < currentTime ? oldest : current;
            }
            // If only one has a timestamp, prefer the one without (it's newer from recipe)
            if (oldestTime > 0 && currentTime === 0) return current;
            if (currentTime > 0 && oldestTime === 0) return oldest;
            // If neither has timestamp, use array order (first is oldest)
            return oldest;
          });
          soundsToRemove.push(oldestSound);
        }
      }
      
      // Update UI immediately - add new sound and remove old ones
      const remainingSounds = activeSounds.filter(s => !soundsToRemove.some(r => r.id === s.id));
      const now = Date.now();
      soundTimestampsRef.current[soundId] = now;
      // Clean up timestamps for removed sounds
      soundsToRemove.forEach(s => delete soundTimestampsRef.current[s.id]);
      
      // Final safeguard: ensure we never exceed 3 sounds
      const newSoundsArray = [...remainingSounds, { id: soundId, name: soundName, volume: 50, category }];
      const finalSounds = newSoundsArray.length > 3 
        ? newSoundsArray.slice(-3) // Keep only the last 3 (newest)
        : newSoundsArray;
      
      // If we had to trim, remove timestamps for trimmed sounds
      if (newSoundsArray.length > 3) {
        const trimmedIds = newSoundsArray.slice(0, -3).map(s => s.id);
        trimmedIds.forEach(id => delete soundTimestampsRef.current[id]);
      }
      
      setActiveSounds(finalSounds);
      
      // Handle solo state immediately
      soundsToRemove.forEach(soundToRemove => {
        if (soundToRemove.id === 'spaces') {
          if (soloSoundId === 'spaces') {
            setSoloSoundId(null);
          }
          isUpdatingFromComposerRef.current = true;
          setSpacesVolume(0);
          setTimeout(() => {
            isUpdatingFromComposerRef.current = false;
          }, 0);
        } else {
          if (soloSoundId === soundToRemove.id) {
            setSoloSoundId(null);
          }
        }
      });
      
      // Start playing the new sound immediately with fade in
      if (soundFileMap[soundId]) {
        const audio = new Audio(soundFileMap[soundId]);
        audio.loop = true;
        const targetVolume = (50 / 100) * (globalVolume / 100);
        audioRefs.current[soundId] = audio;
        fadeInAudio(audio, targetVolume, 500);
      }
      
      // Fade out removed sounds in background (non-blocking)
      soundsToRemove.forEach(soundToRemove => {
        if (soundToRemove.id !== 'spaces') {
          const audio = audioRefs.current[soundToRemove.id];
          if (audio) {
            fadeOutAudio(audio, 500).then(() => {
              delete audioRefs.current[soundToRemove.id];
            });
          }
        }
      });
    }
  };

  const updateSoundVolume = (soundId, newVolume) => {
    // Update UI immediately
    setActiveSounds(prevSounds => prevSounds.map((s) => s.id === soundId ? { ...s, volume: newVolume } : s));
    
    if (soundId === 'spaces') {
      const currentVideoId = getBackgroundVideoId();
      if (!currentVideoId) {
        return;
      }
      
      isUpdatingFromComposerRef.current = true;
      
      // Apply solo effect if needed for the actual video player volume
      const actualVolume = soloSoundId !== null
        ? (soloSoundId === 'spaces' ? newVolume : 0)
        : newVolume;
      
      // Update Spaces volume through FocusContext and dispatch event
      setSpacesVolume(actualVolume);
      
      // Reset flag in background
      setTimeout(() => {
        isUpdatingFromComposerRef.current = false;
      }, 0);
    }
  };

  const handleSaveRecipe = () => {
    if (activeSounds.length === 0) {
      alert('Please add at least one sound before saving a recipe.');
      return;
    }
    setShowSaveModal(true);
  };

  const handleConfirmSaveRecipe = () => {
    if (!recipeName.trim()) {
      alert('Please enter a recipe name.');
      return;
    }

    const currentVideoId = getBackgroundVideoId();
    const soundsToSave = activeSounds.filter(sound => {
      if (sound.id === 'spaces') {
        return !!currentVideoId;
      }
      return true;
    }).map(sound => ({
      id: sound.id,
      volume: sound.volume,
      category: sound.category,
    }));
    
    const newRecipe = {
      id: `custom-${Date.now()}`,
      name: recipeName.trim(),
      icon: recipeType,
      sounds: soundsToSave,
      globalVolume,
      timestamp: Date.now(),
      isCustom: true,
    };

    const updatedCustomRecipes = [...customRecipes, newRecipe];
    setCustomRecipes(updatedCustomRecipes);
    localStorage.setItem('soundscape-custom-recipes', JSON.stringify(updatedCustomRecipes));
    
    // Reset form
    setRecipeName('');
    setRecipeType('bolt');
    setShowSaveModal(false);
  };

  const handleDeleteRecipe = (recipeId, e) => {
    e.stopPropagation();
    const recipe = customRecipes.find(r => r.id === recipeId);
    setRecipeToDelete({ id: recipeId, name: recipe?.name || 'this recipe' });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (recipeToDelete) {
      const updated = customRecipes.filter(r => r.id !== recipeToDelete.id);
      setCustomRecipes(updated);
      localStorage.setItem('soundscape-custom-recipes', JSON.stringify(updated));
    }
    setShowDeleteConfirm(false);
    setRecipeToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setRecipeToDelete(null);
  };

  const handleRecipeClick = (recipeId) => {
    // Don't set selectedRecipe - we'll determine active state by matching sounds
    const recipe = focusRecipes.find(r => r.id === recipeId);
    if (recipe && recipe.sounds) {
      // Load recipe sounds - filter out invalid sounds and remove Spaces from recipe (handle separately)
      const newSounds = recipe.sounds
        .filter(sound => (soundFileMap[sound.id] || sound.id === 'spaces') && sound.id !== 'spaces')
        .map(sound => ({
          id: sound.id,
          name: soundLibrary[sound.category]?.find(s => s.id === sound.id)?.name || sound.id,
          volume: sound.volume || 50,
          category: sound.category,
        }));

      // Handle Spaces separately - check if recipe includes Spaces and if video exists
      const currentVideoId = getBackgroundVideoId();
      const recipeHasSpaces = recipe.sounds.some(s => s.id === 'spaces');
      const spacesSoundInActive = activeSounds.find(s => s.id === 'spaces');
      
      let finalSounds = [...newSounds];
      
      // Determine if Spaces should be included
      let shouldIncludeSpaces = false;
      let spacesToAdd = null;
      
      if (recipeHasSpaces && currentVideoId) {
        // Recipe includes Spaces - use recipe's Spaces volume
        const spacesVolume = recipe.sounds.find(s => s.id === 'spaces')?.volume || 50;
        spacesToAdd = {
          id: 'spaces',
          name: 'Spaces',
          volume: spacesVolume,
          category: 'Atmosphere'
        };
        shouldIncludeSpaces = true;
      } else if (!recipeHasSpaces && spacesSoundInActive && currentVideoId) {
        // Recipe doesn't include Spaces, but Spaces is already active - keep it
        spacesToAdd = spacesSoundInActive;
        shouldIncludeSpaces = true;
      } else if (spacesSoundInActive && !currentVideoId) {
        // Remove Spaces if video is gone
        setSpacesVolume(0);
      }

      // Add Spaces if it should be included
      if (shouldIncludeSpaces && spacesToAdd) {
        finalSounds.push(spacesToAdd);
      }

      // Always enforce 3-layer limit - remove oldest sounds if needed
      if (finalSounds.length > 3) {
        const spacesInFinal = finalSounds.find(s => s.id === 'spaces');
        const nonSpaces = finalSounds.filter(s => s.id !== 'spaces');
        // Keep the most recent 3 non-Spaces sounds, then add Spaces if it exists
        const toKeep = nonSpaces.slice(-3);
        finalSounds = spacesInFinal ? [...toKeep, spacesInFinal] : toKeep;
        
        // If Spaces was removed due to limit, mute it
        if (spacesInFinal && !finalSounds.find(s => s.id === 'spaces')) {
          isUpdatingFromComposerRef.current = true;
          setSpacesVolume(0);
          setTimeout(() => {
            isUpdatingFromComposerRef.current = false;
          }, 0);
        }
      }

      // Update timestamps for all sounds in the recipe (they're all "new" when recipe loads)
      const now = Date.now();
      finalSounds.forEach(sound => {
        soundTimestampsRef.current[sound.id] = now;
      });
      
      // Clean up timestamps for sounds that are being removed
      const removedSoundIds = activeSounds
        .filter(s => !finalSounds.some(f => f.id === s.id))
        .map(s => s.id);
      removedSoundIds.forEach(id => delete soundTimestampsRef.current[id]);

      // Update UI immediately
      setActiveSounds(finalSounds);
      setSoloSoundId(null); // Reset solo when loading a recipe

      // Fade out old sounds in background (non-blocking)
      Object.entries(audioRefs.current)
        .filter(([soundId]) => soundId !== 'spaces' && !finalSounds.some(s => s.id === soundId))
        .forEach(([soundId, audio]) => {
          if (audio) {
            fadeOutAudio(audio, 500).then(() => {
              delete audioRefs.current[soundId];
            });
          }
        });

      // Start playing new sounds immediately with fade in
      finalSounds.forEach((sound) => {
        if (sound.id === 'spaces') {
          const spacesVolume = sound.volume || 50;
          isUpdatingFromComposerRef.current = true;
          setSpacesVolume(spacesVolume);
          setTimeout(() => {
            isUpdatingFromComposerRef.current = false;
          }, 0);
        } else if (soundFileMap[sound.id] && !audioRefs.current[sound.id]) {
          const audio = new Audio(soundFileMap[sound.id]);
          audio.loop = true;
          const targetVolume = (sound.volume / 100) * (globalVolume / 100);
          audioRefs.current[sound.id] = audio;
          fadeInAudio(audio, targetVolume, 500);
        }
      });
    }
  };

  const handleGlobalVolumeChange = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newVolume = parseInt(e.target.value);
    if (!isNaN(newVolume) && newVolume >= 0 && newVolume <= 100) {
      setGlobalVolume(newVolume);
    }
  };

  const handleSoloToggle = (soundId) => {
    // Calculate the new solo state
    const newSoloId = soloSoundId === soundId ? null : soundId;
    
    // Update solo state
    setSoloSoundId(newSoloId);
    
    // Immediately apply solo effect to all sounds
    activeSounds.forEach((sound) => {
      if (sound.id === 'spaces') {
        // Handle Spaces separately
        const calculatedVolume = newSoloId !== null
          ? (newSoloId === 'spaces' ? sound.volume : 0)
          : sound.volume;
        isUpdatingFromComposerRef.current = true;
        setSpacesVolume(calculatedVolume);
        setTimeout(() => {
          isUpdatingFromComposerRef.current = false;
        }, 0);
      } else {
        // Handle regular audio files
        const audio = audioRefs.current[sound.id];
        if (audio) {
          if (newSoloId !== null) {
            if (sound.id === newSoloId) {
              // This is the soloed sound - play it at full volume
              const targetVolume = (sound.volume / 100) * (globalVolume / 100);
              audio.volume = targetVolume;
              if (audio.paused) {
                audio.play().catch(() => {}); // Ensure it's playing
              }
            } else {
              // This is not the soloed sound - mute it
              audio.volume = 0;
            }
          } else {
            // Solo is off - restore normal volume for all sounds
            audio.volume = (sound.volume / 100) * (globalVolume / 100);
          }
        }
      }
    });
  };

  const handleSoundMuteToggle = (soundId) => {
    const sound = activeSounds.find(s => s.id === soundId);
    if (!sound) return;

    const currentVolume = sound.volume;
    const isMuted = currentVolume === 0;

    if (isMuted) {
      // Unmute: restore previous volume or use default
      const previousVolume = previousVolumesRef.current[soundId] || 50;
      updateSoundVolume(soundId, previousVolume);
      delete previousVolumesRef.current[soundId];
    } else {
      // Mute: save current volume and set to 0
      previousVolumesRef.current[soundId] = currentVolume;
      updateSoundVolume(soundId, 0);
    }
  };

  const handleMasterMuteToggle = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const isMuted = globalVolume === 0;

    if (isMuted) {
      // Unmute: restore previous volume or use default
      const previousVolume = previousGlobalVolumeRef.current > 0 ? previousGlobalVolumeRef.current : 75;
      setGlobalVolume(previousVolume);
    } else {
      // Mute: save current volume and set to 0
      if (globalVolume > 0) {
        previousGlobalVolumeRef.current = globalVolume;
      }
      setGlobalVolume(0);
    }
  };

  // Check if a recipe matches the current active sounds exactly
  const isRecipeActive = (recipe) => {
    if (!recipe || !recipe.sounds || recipe.sounds.length === 0) return false;
    
    const currentVideoId = getBackgroundVideoId();
    const currentSpacesVolume = getSpacesVolume();
    const spacesIsActive = currentVideoId && currentSpacesVolume > 0;
    
    // Get recipe sound IDs (excluding Spaces for now)
    const recipeSoundIds = recipe.sounds
      .filter(s => s.id !== 'spaces')
      .map(s => s.id)
      .sort();
    
    // Get active sound IDs (excluding Spaces) - only sounds that are actually playing
    // Check if audio ref exists (sound is actually playing)
    const activeSoundIds = activeSounds
      .filter(s => {
        if (s.id === 'spaces') return false;
        // Only include if audio ref exists (sound is playing)
        return !!audioRefs.current[s.id];
      })
      .map(s => s.id)
      .sort();
    
    // Check if recipe includes Spaces
    const recipeHasSpaces = recipe.sounds.some(s => s.id === 'spaces');
    
    // Check if non-Spaces sounds match exactly (same count and same IDs)
    if (recipeSoundIds.length !== activeSoundIds.length) {
      return false; // Different number of sounds
    }
    
    // If both have no sounds, check only Spaces
    if (recipeSoundIds.length === 0) {
      // Recipe has no non-Spaces sounds, so match depends only on Spaces
      return recipeHasSpaces ? spacesIsActive : !spacesIsActive;
    }
    
    // Check if all sound IDs match
    const soundsMatch = recipeSoundIds.every((id, index) => id === activeSoundIds[index]);
    if (!soundsMatch) {
      return false;
    }
    
    // Check Spaces match
    // If recipe has Spaces, Spaces must be active
    // If recipe doesn't have Spaces, Spaces must NOT be active
    const spacesMatch = recipeHasSpaces 
      ? spacesIsActive  // Recipe has Spaces, so Spaces should be active
      : !spacesIsActive; // Recipe doesn't have Spaces, so Spaces should NOT be active
    
    return soundsMatch && spacesMatch;
  };

  // Show all sounds in activeSounds - solo only affects audio playback, not visibility
  // Filter out only sounds that are truly removed (no audio ref and not Spaces)
  // Also deduplicate to prevent duplicate keys
  const playableSounds = activeSounds
    .filter(sound => {
      if (sound.id === 'spaces') {
        const videoId = getBackgroundVideoId();
        // Show Spaces if video exists (regardless of volume - solo can mute it temporarily)
        return !!videoId;
      }
      // For regular sounds, show if audio exists (even if muted by solo)
      // Solo affects volume, not visibility - sounds should remain visible
      const audio = audioRefs.current[sound.id];
      return !!audio;
    })
    .filter((sound, index, self) => 
      // Remove duplicates by keeping only the first occurrence of each id
      index === self.findIndex(s => s.id === sound.id)
    );

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-out ${
      isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
    }`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 ease-out ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose} 
      />

      {/* Main Modal Container */}
      <div className={`relative w-full max-w-[1000px] bg-[#0f0f12] rounded-[32px] shadow-2xl border border-white/5 overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 ease-out ${
        isOpen 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 translate-y-4'
      }`}>
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Soundscape Composer</h2>
            <p className="text-white/40 text-sm mt-0.5">Mixing {playableSounds.length} layers • Focused</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button 
              onClick={() => {
                const newPlayingState = !isPlaying;
                setIsPlaying(newPlayingState);
                if (typeof window !== 'undefined') {
                  localStorage.setItem('soundscape-is-playing', newPlayingState.toString());
                  window.dispatchEvent(new CustomEvent('soundscape-play-pause-changed', {
                    detail: { isPlaying: newPlayingState }
                  }));
                }
              }}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2d2d36] hover:bg-[#3d3d46] text-white transition-colors"
              title={isPlaying ? "Pause all sounds" : "Play all sounds"}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button 
              data-save-recipe
              onClick={handleSaveRecipe}
              className="px-5 py-2 bg-[#2d2d36] hover:bg-[#3d3d46] text-purple-400 text-sm font-medium rounded-full transition-colors"
            >
              Save Recipe
            </button>
            <button 
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-[#2d2d36] hover:bg-white/10 text-white/60 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          
          {/* SECTION 1: ACTIVE MIXER */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-medium text-white">Active Mixer</h3>
              {/* Master Volume */}
              <div className="flex items-center gap-3 w-48 opacity-60 hover:opacity-100 transition-opacity">
                <button
                  onClick={handleMasterMuteToggle}
                  type="button"
                  className="flex-shrink-0 transition-colors hover:opacity-100 cursor-pointer p-1 -ml-1"
                  title={globalVolume === 0 ? "Unmute master volume" : "Mute master volume"}
                  style={{ pointerEvents: 'auto' }}
                >
                  {globalVolume === 0 ? (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M7 14l12-12" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={globalVolume}
                  onChange={handleGlobalVolumeChange}
                  onInput={handleGlobalVolumeChange}
                  className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer slider-purple"
                  style={{
                    background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${globalVolume}%, rgba(255,255,255,0.1) ${globalVolume}%, rgba(255,255,255,0.1) 100%)`,
                    pointerEvents: 'auto',
                  }}
                />
              </div>
            </div>

            {/* Mixer Grid - 3 Columns */}
            <div className="grid grid-cols-3 gap-4">
              {playableSounds.map(sound => (
                <div key={sound.id} className="bg-[#18181b] border border-white/5 rounded-2xl p-5 relative group">
                  {/* Top Row: Icon + Name + Controls */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="text-purple-500">
                        <SoundIcon soundId={sound.id} className="w-6 h-6" />
                      </div>
                      <span className="text-white font-medium text-sm">{sound.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Mute/Volume Button */}
                      <button 
                        onClick={() => handleSoundMuteToggle(sound.id)}
                        className={`transition-colors ${
                          sound.volume === 0 
                            ? 'text-orange-400' 
                            : 'text-white/20 hover:text-purple-400'
                        }`}
                        title={sound.volume === 0 ? "Unmute this sound" : "Mute this sound"}
                      >
                        {sound.volume === 0 ? (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5.586 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15.536 8.464a5 5 0 0 1 0 7.072m2.828-9.9a9 9 0 0 1 0 12.728M5.586 15H4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          </svg>
                        )}
                      </button>
                      {/* Solo/Headphone Button */}
                      <button 
                        onClick={() => handleSoloToggle(sound.id)}
                        className={`transition-colors ${
                          soloSoundId === sound.id 
                            ? 'text-purple-400' 
                            : 'text-white/20 hover:text-purple-400'
                        }`}
                        title={soloSoundId === sound.id ? "Disable solo (hear all sounds)" : "Solo this sound (hear only this)"}
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 14v-4a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v4"></path>
                          <path d="M9 18v2a3 3 0 0 0 6 0v-2"></path>
                          <path d="M5 18h14"></path>
                        </svg>
                      </button>
                      {/* Remove Button */}
                      <button 
                        onClick={() => {
                          if (soloSoundId === sound.id) {
                            setSoloSoundId(null);
                          }
                          handleSoundClick(sound.id, sound.category);
                        }}
                        className="text-white/20 hover:text-orange-400 transition-colors"
                        title="Remove sound"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row: Slider + Percentage */}
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sound.volume}
                      onChange={(e) => updateSoundVolume(sound.id, parseInt(e.target.value))}
                      className="flex-1 h-1.5 bg-[#2d2d36] rounded-full appearance-none cursor-pointer slider-purple"
                      style={{
                        background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${sound.volume}%, #2d2d36 ${sound.volume}%, #2d2d36 100%)`,
                      }}
                    />
                    <span className="text-white/40 text-xs w-6 text-right">{sound.volume}%</span>
                  </div>
                </div>
              ))}
              
              {/* Empty Slots */}
              {[...Array(Math.max(0, 3 - playableSounds.length))].map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    document.querySelector('[data-library-section]')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                  }}
                  className="bg-[#18181b]/50 border border-white/5 border-dashed rounded-2xl p-5 flex items-center justify-center hover:border-purple-500/50 hover:bg-[#18181b] transition-colors"
                >
                  <span className="text-white/20 text-sm">Add Sound</span>
                </button>
              ))}
            </div>
          </section>

          {/* SECTION 2: LIBRARY */}
          <section data-library-section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-white">Library</h3>
              {/* Pill Tabs */}
              <div className="bg-[#18181b] p-1 rounded-full flex">
                {['Atmosphere', 'Neural', 'Rhythm'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all ${
                      activeTab === tab 
                      ? 'bg-[#8b5cf6] text-white shadow-lg' 
                      : 'text-white/40 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Library Grid */}
            <div className="grid grid-cols-4 gap-4">
              {soundLibrary[activeTab]?.map(sound => {
                const currentVideoId = getBackgroundVideoId();
                const isActive = sound.id === 'spaces' 
                  ? !!currentVideoId && activeSounds.some(s => s.id === 'spaces')
                  : activeSounds.some(s => s.id === sound.id);
                
                // For Spaces: Enable if video exists, disable only if no video
                // Note: We allow adding Spaces even at 3 layers (it will remove the oldest)
                const isSpacesDisabled = sound.id === 'spaces' && !currentVideoId;
                
                return (
                  <button
                    key={sound.id}
                    onClick={() => handleSoundClick(sound.id, activeTab)}
                    disabled={isSpacesDisabled}
                    className={`
                      relative px-6 py-8 rounded-3xl border transition-all duration-200 flex flex-col items-center justify-center gap-4 group
                      ${isSpacesDisabled 
                        ? 'bg-[#18181b]/50 border-white/5 opacity-50 cursor-not-allowed'
                        : isActive 
                        ? 'bg-[#8b5cf6]/10 border-[#8b5cf6] shadow-[0_0_15px_rgba(139,92,246,0.15)]' 
                        : 'bg-[#18181b] border-white/5 hover:border-white/10 hover:bg-[#202024]'
                      }
                    `}
                    style={{ minHeight: '140px' }}
                  >
                    <div className={`${isActive ? 'text-[#8b5cf6]' : 'text-white/70 group-hover:text-white'} transition-colors`}>
                      <SoundIcon soundId={sound.id} className="w-8 h-8" />
                    </div>
                    <div className="text-center">
                      <div className="text-white font-medium text-sm mb-1">{sound.name}</div>
                      <div className={`text-xs ${isActive ? 'text-[#8b5cf6]' : 'text-white/30'}`}>
                        {isActive ? 'Active' : sound.description}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          {/* SECTION 3: FOCUS RECIPES */}
          <section>
            <h3 className="text-lg font-medium text-white mb-4">Focus Recipes</h3>
            <div className="flex gap-3 flex-wrap">
              {focusRecipes.map(recipe => {
                const isActive = isRecipeActive(recipe);
                const isCustom = recipe.isCustom;
                return (
                  <div key={recipe.id} className="relative group">
                    <button
                      onClick={() => handleRecipeClick(recipe.id)}
                      className={`
                        px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 transition-all relative
                        ${isActive 
                          ? 'bg-[#5b21b6] text-white border border-[#7c3aed]' 
                          : 'bg-[#18181b] border border-white/5 text-white/50 hover:bg-[#202024] hover:text-white'
                        }
                      `}
                    >
                      <RecipeIcon recipeId={recipe.id} icon={recipe.icon} className={`w-4 h-4 ${isActive ? 'text-[#a78bfa]' : ''}`} />
                      {recipe.name}
                    </button>
                    {isCustom && (
                      <button
                        onClick={(e) => handleDeleteRecipe(recipe.id, e)}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-[#2d2d36] hover:bg-[#3d3d46] border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Delete recipe"
                      >
                        <svg className="w-3 h-3 text-white/60 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* FOOTER */}
        <div className="px-8 py-4 bg-[#0a0a0c] border-t border-white/5 flex justify-between items-center text-xs text-white/30">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
            <span>Audio Engine: Ready</span>
            <span className="opacity-50">|</span>
            <span>Sample Rate: 48kHz</span>
          </div>
          <div>© 2024 ThryvLoop Productivity Inc.</div>
        </div>
      </div>

      {/* Save Recipe Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowSaveModal(false)}
          />
          <div className="relative bg-[#0f0f12] rounded-2xl border border-white/5 shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-6">Save Recipe</h3>
            
            <div className="space-y-6">
              {/* Recipe Name */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Recipe Name
                </label>
                <input
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="e.g., My Focus Mix"
                  className="w-full px-4 py-2.5 bg-[#18181b] border border-white/5 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirmSaveRecipe();
                    } else if (e.key === 'Escape') {
                      setShowSaveModal(false);
                    }
                  }}
                />
              </div>

              {/* Recipe Type */}
              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">
                  Recipe Type
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { id: 'bolt', label: 'Bolt', icon: '⚡' },
                    { id: 'code', label: 'Code', icon: '</>' },
                    { id: 'pen', label: 'Pen', icon: '✏️' },
                    { id: 'lotus', label: 'Lotus', icon: '🪷' },
                    { id: 'briefcase', label: 'Case', icon: '💼' },
                  ].map(type => (
                    <button
                      key={type.id}
                      onClick={() => setRecipeType(type.id)}
                      className={`
                        p-4 rounded-xl border transition-all flex flex-col items-center gap-2
                        ${recipeType === type.id
                          ? 'bg-[#8b5cf6]/20 border-[#8b5cf6] text-purple-400'
                          : 'bg-[#18181b] border-white/5 text-white/50 hover:border-white/10 hover:text-white'
                        }
                      `}
                    >
                      <RecipeIcon icon={type.id} className="w-5 h-5" />
                      <span className="text-xs font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setRecipeName('');
                    setRecipeType('bolt');
                  }}
                  className="flex-1 px-4 py-2.5 bg-[#18181b] hover:bg-[#202024] text-white/70 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSaveRecipe}
                  className="flex-1 px-4 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg transition-colors font-medium"
                >
                  Save Recipe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleCancelDelete}
          />
          <div className="relative bg-[#0f0f12] rounded-2xl border border-white/5 shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Delete Recipe</h3>
                <p className="text-white/60 text-sm mt-1">
                  Are you sure you want to delete <span className="text-white font-medium">"{recipeToDelete?.name}"</span>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2.5 bg-[#18181b] hover:bg-[#202024] text-white/70 hover:text-white rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2.5 bg-[#2d2d36] hover:bg-[#3d3d46] text-white rounded-lg transition-colors font-medium border border-white/10"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Styles */}
      <style jsx>{`
        input[type=range].slider-purple {
          -webkit-appearance: none; 
          background: transparent; 
        }
        input[type=range].slider-purple::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          margin-top: -3px; 
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }
        input[type=range].slider-purple::-webkit-slider-runnable-track {
          width: 100%;
          height: 6px;
          cursor: pointer;
          border-radius: 999px;
        }
        input[type=range].slider-purple::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
        }
        input[type=range].slider-purple::-moz-range-track {
          width: 100%;
          height: 6px;
          cursor: pointer;
          border-radius: 999px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #0f0f12; 
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46; 
        }
      `}</style>
    </div>
  );
}
