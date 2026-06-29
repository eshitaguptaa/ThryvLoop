'use client';

import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { FocusContext } from '@/contexts/FocusContext';
import { getUserStorageItem, getUserStorageJson, removeUserStorageItem, setUserStorageItem, setUserStorageJson } from '@/utils/userStorage';
import { DEFAULT_SPACES_VIDEO_ID, DEFAULT_SPACES_VOLUME, resolveSpacesVideoId } from '@/lib/spacesConstants';
import { SPACES_CATEGORIES, SPACES_CATALOG, filterSpacesByCategory } from '@/lib/spacesCatalog';
import {
  applySpacesBaseVolume,
  isSpacesVisuallyMuted,
  toggleSpacesMute,
} from '@/lib/spacesVolumeControl';

const DRAWER_TRANSITION_MS = 300;

export default function SpacesDrawer({ isOpen, onClose }) {
  const { user } = useUser();
  const userId = user?.id || null;
  const [activeTab, setActiveTab] = useState('Videos');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Try to get context, but don't fail if not available (for use outside focus pages)
  const focusContext = useContext(FocusContext);
  
  // Get volume from context or localStorage
  const getVolume = () => {
    if (focusContext?.volume !== undefined) {
      return focusContext.volume;
    }
    if (typeof window !== 'undefined') {
      const saved = getUserStorageItem(userId, 'focus-video-volume', 'focus-video-volume');
      return saved ? parseInt(saved, 10) : DEFAULT_SPACES_VOLUME;
    }
    return DEFAULT_SPACES_VOLUME;
  };
  
  const [volumeState, setVolumeState] = useState(getVolume);
  const isUpdatingFromDrawerRef = useRef(false);
  const [spacesMuted, setSpacesMuted] = useState(() =>
    isSpacesVisuallyMuted(userId, getVolume()),
  );

  const syncSpacesMuted = useCallback(() => {
    const currentVol = focusContext?.volume ?? volumeState;
    setSpacesMuted(isSpacesVisuallyMuted(userId, currentVol));
  }, [userId, focusContext?.volume, volumeState]);
  
  // Listen for volume changes from SoundscapeComposer
  useEffect(() => {
    const handleVolumeChange = (e) => {
      if (e.detail?.playbackOnly) return;
      // Ignore if we're the one who triggered this event
      if (isUpdatingFromDrawerRef.current) {
        isUpdatingFromDrawerRef.current = false;
        return;
      }
      
      const newVolume = e.detail?.volume;
      if (newVolume !== undefined) {
        // Update context first (if available), then state
        if (focusContext?.setVolume) {
          focusContext.setVolume(newVolume);
        }
        // Always update local state as well (for when context is not available)
        setVolumeState(newVolume);
        setSpacesMuted(isSpacesVisuallyMuted(userId, newVolume));
      }
    };

    const handlePauseChange = () => syncSpacesMuted();

    if (typeof window !== 'undefined') {
      window.addEventListener('focus-volume-changed', handleVolumeChange);
      window.addEventListener('focus-spaces-pause-changed', handlePauseChange);
      window.addEventListener('soundscape-state-changed', handlePauseChange);
      window.addEventListener('soundscape-play-pause-changed', handlePauseChange);
      return () => {
        window.removeEventListener('focus-volume-changed', handleVolumeChange);
        window.removeEventListener('focus-spaces-pause-changed', handlePauseChange);
        window.removeEventListener('soundscape-state-changed', handlePauseChange);
        window.removeEventListener('soundscape-play-pause-changed', handlePauseChange);
      };
    }
  }, [focusContext?.setVolume, syncSpacesMuted, userId]);

  useEffect(() => {
    if (isOpen) syncSpacesMuted();
  }, [isOpen, syncSpacesMuted]);
  
  // Use context when inside FocusProvider; local state is fallback only
  const volume = focusContext?.volume ?? volumeState;
  const showSpacesMuted = spacesMuted;
  const setVolume = (val) => {
    const currentVolume = focusContext?.volume ?? volumeState;
    isUpdatingFromDrawerRef.current = true;

    const clamped = applySpacesBaseVolume(userId, currentVolume, val);

    if (focusContext?.setVolume) {
      focusContext.setVolume(clamped);
    }
    setVolumeState(clamped);
    setSpacesMuted(isSpacesVisuallyMuted(userId, clamped));

    setTimeout(() => {
      isUpdatingFromDrawerRef.current = false;
    }, 0);
  };
  
  // Get backgroundVideoId from context or localStorage
  const getBackgroundVideoId = () => {
    if (focusContext?.backgroundVideoId) {
      return resolveSpacesVideoId(focusContext.backgroundVideoId);
    }
    if (typeof window !== 'undefined') {
      return resolveSpacesVideoId(
        getUserStorageItem(userId, 'focus-background-video-id', 'focus-background-video-id')
      );
    }
    return DEFAULT_SPACES_VIDEO_ID;
  };
  
  const [backgroundVideoId, setBackgroundVideoIdState] = useState(getBackgroundVideoId);
  
  // Sync with context changes
  useEffect(() => {
    if (focusContext?.backgroundVideoId !== undefined) {
      setBackgroundVideoIdState(focusContext.backgroundVideoId);
    } else {
      // If no context, read from localStorage
      const saved = typeof window !== 'undefined' 
        ? getUserStorageItem(userId, 'focus-background-video-id', 'focus-background-video-id') 
        : null;
      setBackgroundVideoIdState(resolveSpacesVideoId(saved));
    }
  }, [focusContext?.backgroundVideoId, userId]);
  
  // Use context setter if available, otherwise save to localStorage directly
  const setBackgroundVideoId = (videoId) => {
    if (focusContext?.setBackgroundVideoId) {
      focusContext.setBackgroundVideoId(videoId);
    } else {
      setBackgroundVideoIdState(videoId);
      if (typeof window !== 'undefined') {
        if (videoId) {
          setUserStorageItem(userId, 'focus-background-video-id', videoId);
        } else {
          removeUserStorageItem(userId, 'focus-background-video-id');
        }
      }
    }
  };

  // Favorites management
  const getFavorites = () => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = getUserStorageJson(userId, 'focus-video-favorites', 'focus-video-favorites');
      return saved || [];
    } catch (e) {
      return [];
    }
  };

  const [favorites, setFavorites] = useState(getFavorites);
  const [isPresent, setIsPresent] = useState(false);
  const [isShown, setIsShown] = useState(false);

  // Mount off-screen first, then slide in on the next frame to avoid open jitter.
  useEffect(() => {
    if (isOpen) {
      setIsPresent(true);
      let cancelled = false;
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) setIsShown(true);
        });
      });
      return () => {
        cancelled = true;
        cancelAnimationFrame(frame);
      };
    }

    setIsShown(false);
    const timer = window.setTimeout(() => setIsPresent(false), DRAWER_TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  // Sync favorites from localStorage on mount
  useEffect(() => {
    setFavorites(getFavorites());
  }, [userId]);

  const toggleFavorite = (videoId) => {
    const newFavorites = favorites.includes(videoId)
      ? favorites.filter(id => id !== videoId)
      : [...favorites, videoId];
    
    setFavorites(newFavorites);
    if (typeof window !== 'undefined') {
      setUserStorageJson(userId, 'focus-video-favorites', newFavorites);
    }
  };

  const isFavorite = (videoId) => {
    return favorites.includes(videoId);
  };

  // Handle body scroll lock
  useEffect(() => {
    if (!isPresent) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isPresent]);

  const categories = SPACES_CATEGORIES;
  const allSpaces = SPACES_CATALOG;

  // Filter spaces by category - show all videos by default
  const filteredSpaces = activeTab === 'Videos' 
    ? filterSpacesByCategory(selectedCategory)
    : activeTab === 'Favorites'
    ? allSpaces.filter(space => favorites.includes(space.videoId))
    : [];

  // Get currently selected background space
  const currentSpace = backgroundVideoId 
    ? allSpaces.find(space => space.videoId === backgroundVideoId)
    : null;

  const handleVideoClick = (videoId) => {
    setBackgroundVideoId(videoId);
    // This ensures it works even if context is not available
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('focus-video-changed', {
        detail: { videoId }
      }));

      if (volume > 0) {
        setUserStorageItem(userId, 'focus-spaces-paused', 'false');
        setUserStorageItem(userId, 'soundscape-session-active', 'true');
        setUserStorageItem(userId, 'soundscape-is-playing', 'true');
        window.dispatchEvent(new CustomEvent('focus-spaces-activate'));
        window.dispatchEvent(
          new CustomEvent('focus-volume-changed', {
            detail: { volume, playbackOnly: true },
          })
        );
        window.dispatchEvent(
          new CustomEvent('soundscape-play-pause-changed', { detail: { isPlaying: true } })
        );
        window.dispatchEvent(new CustomEvent('soundscape-state-changed'));
      }
    }
  };

  const getYouTubeThumbnail = (videoId) => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  return (
    <>
      {/* Backdrop */}
      {isPresent ? (
      <div 
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-out ${
          isShown ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden={!isShown}
      />
      ) : null}
      
      {/* Drawer */}
      {isPresent ? (
      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-card z-50 overflow-hidden flex flex-col transform transition-transform duration-300 ease-out will-change-transform ${
          isShown
            ? 'translate-x-0 shadow-2xl'
            : 'translate-x-full shadow-none pointer-events-none'
        }`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isShown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-gradient-to-r from-muted/80 to-card">
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Spaces</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {/* Tabs */}
            <div className="flex gap-6 mb-6 border-b border-border">
              {['Videos', 'Images', 'Favorites'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 px-1 text-sm font-semibold transition-all duration-200 relative ${
                    activeTab === tab
                      ? 'text-[#5043F3] border-b-2 border-[#5043F3]'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#5043F3]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search space"
                  className="w-full pl-12 pr-4 py-3 border border-border rounded-xl bg-muted focus:outline-none focus:ring-2 focus:ring-[#5043F3]/20 focus:border-[#5043F3] focus:bg-card text-foreground transition-all duration-200 placeholder:text-muted-foreground shadow-sm hover:shadow-md"
                />
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === category.id
                      ? 'bg-[#5043F3] text-white shadow-md shadow-[#5043F3]/20'
                      : 'bg-card text-muted-foreground border border-border hover:bg-muted hover:border-border hover:shadow-sm'
                  }`}
                >
                  {category.icon && <span className="text-lg">{category.icon}</span>}
                  {category.name}
                </button>
              ))}
              <button className="px-3 py-2 text-muted-foreground hover:text-foreground transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Featured Spaces or Filtered Spaces */}
            {activeTab === 'Videos' && (
            <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-4 tracking-tight">
                  {selectedCategory === 'all' ? 'All Spaces' : `${categories.find(c => c.id === selectedCategory)?.name || ''} Spaces`}
                </h3>
              <div className="grid grid-cols-2 gap-5 p-2">
                {filteredSpaces.map((space) => {
                  const isSelected = backgroundVideoId === space.videoId;
                  return (
                    <div 
                      key={space.id} 
                      className="group cursor-pointer"
                      onClick={() => handleVideoClick(space.videoId)}
                    >
                      <div className={isSelected ? 'rounded-xl p-1.5' : 'rounded-xl p-0.5'}>
                        <div
                          className={`relative aspect-video rounded-lg overflow-hidden bg-muted transition-all duration-300 ${
                            isSelected
                              ? 'ring-2 ring-[#5043F3] shadow-[0_0_0_1px_#5043F3,0_0_16px_4px_rgba(80,67,243,0.9),0_0_32px_8px_rgba(124,58,237,0.55)]'
                              : 'shadow-md group-hover:scale-[1.02] group-hover:shadow-xl'
                          }`}
                        >
                        <img
                          src={getYouTubeThumbnail(space.videoId)}
                          alt={space.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(space.videoId);
                          }}
                          className={`absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 z-10 shadow-md ${
                            isFavorite(space.videoId)
                              ? 'bg-red-500 hover:bg-red-600 scale-110'
                              : 'bg-card/95 hover:bg-card backdrop-blur-sm dark:bg-card/90'
                          }`}
                          title={isFavorite(space.videoId) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <svg 
                            className={`w-4.5 h-4.5 ${isFavorite(space.videoId) ? 'text-white' : 'text-muted-foreground'}`} 
                            fill={isFavorite(space.videoId) ? "currentColor" : "none"} 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                        </div>
                      </div>
                      <p className={`mt-2 text-sm font-semibold line-clamp-1 transition-colors ${isSelected ? 'text-[#5043F3]' : 'text-foreground'}`}>{space.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            )}

            {activeTab === 'Images' && (
              <div className="mb-6">
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground text-sm font-medium">Images coming soon</p>
                </div>
              </div>
            )}

            {activeTab === 'Favorites' && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-foreground mb-4 tracking-tight">Favorite Spaces</h3>
                {filteredSpaces.length > 0 ? (
                  <div className="grid grid-cols-2 gap-5 p-2">
                    {filteredSpaces.map((space) => {
                      const isSelected = backgroundVideoId === space.videoId;
                      return (
                        <div 
                          key={space.id} 
                          className="group cursor-pointer"
                          onClick={() => handleVideoClick(space.videoId)}
                        >
                          <div className={isSelected ? 'rounded-xl p-1.5' : 'rounded-xl p-0.5'}>
                            <div
                              className={`relative aspect-video rounded-lg overflow-hidden bg-muted transition-all duration-300 ${
                                isSelected
                                  ? 'ring-2 ring-[#5043F3] shadow-[0_0_0_1px_#5043F3,0_0_16px_4px_rgba(80,67,243,0.9),0_0_32px_8px_rgba(124,58,237,0.55)]'
                                  : 'shadow-md group-hover:scale-[1.02] group-hover:shadow-xl'
                              }`}
                            >
                            <img
                              src={getYouTubeThumbnail(space.videoId)}
                              alt={space.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(space.videoId);
                              }}
                              className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-full transition-all duration-200 z-10 shadow-md hover:scale-110"
                              title="Remove from favorites"
                            >
                              <svg 
                                className="w-4.5 h-4.5 text-white" 
                                fill="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </button>
                            </div>
                          </div>
                          <p className={`mt-2 text-sm font-semibold line-clamp-1 transition-colors ${isSelected ? 'text-[#5043F3]' : 'text-foreground'}`}>{space.name}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                      <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <p className="text-muted-foreground text-sm">No favorites yet. Click the heart icon on any video to add it to favorites.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Currently Playing Footer */}
        <div className="border-t border-border bg-gradient-to-b from-muted/80 to-card p-5 shadow-lg">
          {currentSpace ? (
            <>
              {/* Current Video Info */}
              <div className="flex items-center gap-2.5 mb-4">
                <span className="text-sm font-bold text-foreground">{currentSpace.name}</span>
              </div>
              {/* Volume Controls */}
          <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    const currentVolume = volume;
                    isUpdatingFromDrawerRef.current = true;
                    const next = toggleSpacesMute(userId, currentVolume);
                    if (focusContext?.setVolume) {
                      focusContext.setVolume(next);
                    }
                    setVolumeState(next);
                    setSpacesMuted(isSpacesVisuallyMuted(userId, next));
                    setTimeout(() => {
                      isUpdatingFromDrawerRef.current = false;
                    }, 0);
                  }}
                  className={`flex-shrink-0 transition-colors p-1 ${
                    showSpacesMuted
                      ? 'text-orange-400 hover:text-orange-300'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {showSpacesMuted ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M17 10l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 flex items-center gap-4">
                  <div 
                    className="group relative h-0.5 flex-1 cursor-pointer rounded-full bg-muted"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const slider = e.currentTarget;
                      const handleMouseMove = (e2) => {
                        e2.preventDefault();
                        const rect = slider.getBoundingClientRect();
                        const percent = Math.max(0, Math.min(100, ((e2.clientX - rect.left) / rect.width) * 100));
                        setVolume(Math.round(percent));
                      };
                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                      };
                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                      const rect = slider.getBoundingClientRect();
                      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                      setVolume(Math.round(percent));
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const rect = e.currentTarget.getBoundingClientRect();
                      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                      setVolume(Math.round(percent));
                    }}
                  >
                    <div 
                      className="absolute left-0 top-0 h-full rounded-full bg-[#5043F3] shadow-[0_0_8px_rgba(80,67,243,0.75),0_0_16px_rgba(80,67,243,0.4)]"
                      style={{ width: `${volume}%`, transition: 'none' }}
                    />
                    <div 
                      className="absolute top-1/2 w-3.5 h-3.5 -translate-y-1/2 cursor-pointer rounded-full border border-white bg-[#5043F3] opacity-0 shadow-[0_0_8px_rgba(80,67,243,0.8)] transition-transform hover:scale-110 hover:bg-[#3d35c4] group-hover:opacity-100"
                      style={{ left: `calc(${volume}% - 7px)`, transition: 'left 0s' }}
                    />
                    <div 
                      className="absolute top-1/2 w-2.5 h-2.5 -translate-y-1/2 cursor-pointer rounded-full bg-[#5043F3] shadow-[0_0_6px_rgba(80,67,243,0.7)]"
                      style={{ left: `calc(${volume}% - 5px)`, transition: 'none' }}
                    />
                  </div>
                  <span className="min-w-[3rem] shrink-0 text-right text-base font-medium tabular-nums tracking-tight text-foreground">{Math.round(volume)}%</span>
                </div>
          </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground text-center py-3">
              <div className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>No video selected</span>
              </div>
            </div>
          )}
        </div>
      </div>
      ) : null}
    </>
  );
}

