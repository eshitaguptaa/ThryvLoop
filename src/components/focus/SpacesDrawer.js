'use client';

import { useState, useEffect, useContext } from 'react';
import { FocusContext } from '@/contexts/FocusContext';

export default function SpacesDrawer({ isOpen, onClose }) {
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
      const saved = localStorage.getItem('focus-video-volume');
      return saved ? parseInt(saved) : 50;
    }
    return 50;
  };
  
  const [volumeState, setVolumeState] = useState(getVolume);
  
  // Sync volume with context
  useEffect(() => {
    if (focusContext?.volume !== undefined) {
      setVolumeState(focusContext.volume);
    }
  }, [focusContext?.volume]);
  
  // Use context setter if available
  const volume = focusContext?.volume ?? volumeState;
  const setVolume = (val) => {
    const newVolume = Math.max(0, Math.min(100, val)); // Clamp between 0 and 100
    console.log('Setting volume to:', newVolume);
    
    // Update context if available
    if (focusContext?.setVolume) {
      focusContext.setVolume(newVolume);
    } else {
      setVolumeState(newVolume);
    }
    
    // Always save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('focus-video-volume', newVolume.toString());
      // Always dispatch custom event to ensure video player gets the update
      window.dispatchEvent(new CustomEvent('focus-volume-changed', {
        detail: { volume: newVolume }
      }));
    }
  };
  
  // Get backgroundVideoId from context or localStorage
  const getBackgroundVideoId = () => {
    if (focusContext?.backgroundVideoId) {
      return focusContext.backgroundVideoId;
    }
    if (typeof window !== 'undefined') {
      return localStorage.getItem('focus-background-video-id') || null;
    }
    return null;
  };
  
  const [backgroundVideoId, setBackgroundVideoIdState] = useState(getBackgroundVideoId);
  
  // Sync with context changes
  useEffect(() => {
    if (focusContext?.backgroundVideoId !== undefined) {
      setBackgroundVideoIdState(focusContext.backgroundVideoId);
    } else {
      // If no context, read from localStorage
      const saved = typeof window !== 'undefined' 
        ? localStorage.getItem('focus-background-video-id') 
        : null;
      setBackgroundVideoIdState(saved);
    }
  }, [focusContext?.backgroundVideoId]);
  
  // Use context setter if available, otherwise save to localStorage directly
  const setBackgroundVideoId = (videoId) => {
    if (focusContext?.setBackgroundVideoId) {
      focusContext.setBackgroundVideoId(videoId);
    } else {
      setBackgroundVideoIdState(videoId);
      if (typeof window !== 'undefined') {
        if (videoId) {
          localStorage.setItem('focus-background-video-id', videoId);
        } else {
          localStorage.removeItem('focus-background-video-id');
        }
      }
    }
  };

  // Favorites management
  const getFavorites = () => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('focus-video-favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  };

  const [favorites, setFavorites] = useState(getFavorites);

  // Sync favorites from localStorage on mount
  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const toggleFavorite = (videoId) => {
    const newFavorites = favorites.includes(videoId)
      ? favorites.filter(id => id !== videoId)
      : [...favorites, videoId];
    
    setFavorites(newFavorites);
    if (typeof window !== 'undefined') {
      localStorage.setItem('focus-video-favorites', JSON.stringify(newFavorites));
    }
  };

  const isFavorite = (videoId) => {
    return favorites.includes(videoId);
  };

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

  const categories = [
    { id: 'all', name: 'All', icon: null },
    { id: 'nature', name: 'Nature', icon: '🏔️' },
    { id: 'cafe', name: 'Cafe', icon: '☕' },
    { id: 'urban', name: 'Urban', icon: '🪟' },
    { id: 'floral', name: 'Floral', icon: '🌸' },
    { id: 'vintage', name: 'Vintage', icon: '📷' },
  ];

  // YouTube video IDs for 4K ambient/study videos
  // 
  // HOW TO ADD YOUR OWN VIDEOS:
  // 1. Get your YouTube video ID from the URL:
  //    - Full URL: https://www.youtube.com/watch?v=VIDEO_ID_HERE
  //    - Short URL: https://youtu.be/VIDEO_ID_HERE
  //    - Extract the VIDEO_ID_HERE part
  //
  // 2. Get a thumbnail image:
  //    - Option A: Use YouTube thumbnail: https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg
  //    - Option B: Use any image URL (e.g., from Unsplash)
  //
  // 3. Add a new object to the allSpaces array below with:
  //    - id: Next available number (currently highest is 15)
  //    - name: Display name for your video
  //    - image: Thumbnail image URL
  //    - videoId: Your YouTube video ID
  //    - badge: Optional badge text (e.g., '4K ULTRA HD') or null
  //    - category: One of: 'nature', 'cafe', 'urban', 'floral', 'vintage'
  //
  const allSpaces = [
    // Nature
    { 
      id: 1, 
      name: 'Peaceful World Landscapes', 
      image: 'https://img.youtube.com/vi/lIU4vtkLnDc/maxresdefault.jpg', 
      videoId: 'lIU4vtkLnDc', // Mount Shuksan & Global Nature
      badge: '4K ULTRA HD',
      category: 'nature'
    },
    { 
      id: 2, 
      name: 'Moraine Lake Relaxation', 
      image: 'https://img.youtube.com/vi/Se5NjX-cM5I/maxresdefault.jpg', 
      videoId: 'Se5NjX-cM5I', // Moraine Lake 4K
      badge: '4K ULTRA HD',
      category: 'nature'
    },
    { 
      id: 3, 
      name: 'Tropical Waterfall', 
      image: 'https://img.youtube.com/vi/JdlTsEoJtLA/maxresdefault.jpg', 
      videoId: 'JdlTsEoJtLA', // Tropical Waterfall 4K HDR
      badge: '4K HDR',
      category: 'nature'
    },
    { 
      id: 4, 
      name: 'Clearwater Mountain Lake', 
      image: 'https://img.youtube.com/vi/80tY1jKlH9o/maxresdefault.jpg', 
      videoId: '80tY1jKlH9o', // Clearwater Lake 4K
      badge: '4K ULTRA HD',
      category: 'nature'
    },
    { 
      id: 5, 
      name: 'Forest Rain Ambience', 
      image: 'https://img.youtube.com/vi/mpRv4Ar-TTI/maxresdefault.jpg', 
      videoId: 'mpRv4Ar-TTI', // Gentle Rain on Leaves
      badge: '4K ULTRA HD',
      category: 'nature'
    },
    { 
      id: 6, 
      name: 'Ocean Waves', 
      image: 'https://img.youtube.com/vi/y6ZavlQ1w4o/maxresdefault.jpg', 
      videoId: 'y6ZavlQ1w4o', // The Ocean 4K
      badge: '4K ULTRA HD',
      category: 'nature'
    },
    // Cafe
    { 
      id: 7, 
      name: 'Amsterdam Canal Cafe', 
      image: 'https://img.youtube.com/vi/FWtf1pHBsZQ/maxresdefault.jpg', 
      videoId: 'FWtf1pHBsZQ', // Amsterdam Coffee Shop with Canal View
      badge: '4K ULTRA HD',
      category: 'cafe'
    },
    { 
      id: 8, 
      name: 'Rainy Cozy Coffee Shop', 
      image: 'https://img.youtube.com/vi/kjnBNkUE5IY/maxresdefault.jpg', 
      videoId: 'kjnBNkUE5IY', // Rainy Jazz Cafe
      badge: '4K ULTRA HD',
      category: 'cafe'
    },
    { 
      id: 9, 
      name: 'Tokyo Ghibli Vibes Cafe', 
      image: 'https://img.youtube.com/vi/_MBnoMojjE4/maxresdefault.jpg', 
      videoId: '_MBnoMojjE4', // Urban Serenity Tokyo Cafe
      badge: '4K ULTRA HD',
      category: 'cafe'
    },
    { 
      id: 10, 
      name: 'Parisian Cafe Autumn', 
      image: 'https://img.youtube.com/vi/vb9z91KsxFE/maxresdefault.jpg', 
      videoId: 'vb9z91KsxFE', // Cafe de Paris 4K
      badge: '4K ULTRA HD',
      category: 'cafe'
    },
    // Urban
    { 
      id: 11, 
      name: 'Tokyo Ginza Night Walk', 
      image: 'https://img.youtube.com/vi/xvwfZAwJqHA/maxresdefault.jpg', 
      videoId: 'xvwfZAwJqHA', // Tokyo Ginza Night
      badge: '4K HDR',
      category: 'urban'
    },
    { 
      id: 12, 
      name: 'New York City Night', 
      image: 'https://img.youtube.com/vi/23uRPFhhwNU/maxresdefault.jpg', 
      videoId: '23uRPFhhwNU', // NYC 4K HDR
      badge: '4K HDR',
      category: 'urban'
    },
    // Floral
    { 
      id: 13, 
      name: 'Cherry Blossoms', 
      image: 'https://img.youtube.com/vi/Q4MIOG1BpU0/maxresdefault.jpg', 
      videoId: 'Q4MIOG1BpU0', // Japan Cherry Blossoms
      badge: '4K HDR',
      category: 'floral'
    },
    { 
      id: 14, 
      name: 'Spring Garden & Birds', 
      image: 'https://img.youtube.com/vi/dYfMj1SjzRc/maxresdefault.jpg', 
      videoId: 'dYfMj1SjzRc', // Nightingale & Cherry Blossom
      badge: '4K HDR',
      category: 'floral'
    },
    // Vintage
    { 
      id: 15, 
      name: 'Vintage Room Oldies', 
      image: 'https://img.youtube.com/vi/WinMvfKVUx0/maxresdefault.jpg', 
      videoId: 'WinMvfKVUx0', // Vintage oldies in another room
      badge: 'COZY',
      category: 'vintage'
    },
  ];

  // Filter spaces by category - show all videos by default
  const filteredSpaces = activeTab === 'Videos' 
    ? (selectedCategory === 'all' 
        ? allSpaces 
        : allSpaces.filter(space => space.category === selectedCategory))
    : activeTab === 'Favorites'
    ? allSpaces.filter(space => favorites.includes(space.videoId))
    : [];

  // Get currently selected background space
  const currentSpace = backgroundVideoId 
    ? allSpaces.find(space => space.videoId === backgroundVideoId)
    : null;

  const handleVideoClick = (videoId) => {
    console.log('Video clicked:', videoId);
    console.log('Current backgroundVideoId:', backgroundVideoId);
    console.log('Focus context available:', !!focusContext);
    // Set the selected video as background video
    setBackgroundVideoId(videoId);
    console.log('After setBackgroundVideoId, new value should be:', videoId);
    
    // Dispatch custom event to notify BackgroundVideo component
    // This ensures it works even if context is not available
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('focus-video-changed', {
        detail: { videoId }
      }));
    }
  };

  const getYouTubeThumbnail = (videoId) => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      ></div>
      
      {/* Drawer */}
      <div 
        className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out overflow-hidden flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Spaces</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-200"
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
            <div className="flex gap-6 mb-6 border-b border-gray-200">
              {['Videos', 'Images', 'Favorites'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 px-1 text-sm font-semibold transition-all duration-200 relative ${
                    activeTab === tab
                      ? 'text-[#5043F3] border-b-2 border-[#5043F3]'
                      : 'text-gray-500 hover:text-gray-700'
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
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#5043F3]/20 focus:border-[#5043F3] focus:bg-white text-gray-700 transition-all duration-200 placeholder:text-gray-400 shadow-sm hover:shadow-md"
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
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  {category.icon && <span className="text-lg">{category.icon}</span>}
                  {category.name}
                </button>
              ))}
              <button className="px-3 py-2 text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Featured Spaces or Filtered Spaces */}
            {activeTab === 'Videos' && (
            <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">
                  {selectedCategory === 'all' ? 'All Spaces' : `${categories.find(c => c.id === selectedCategory)?.name || ''} Spaces`}
                </h3>
              <div className="grid grid-cols-2 gap-4">
                {filteredSpaces.map((space) => {
                  const isSelected = backgroundVideoId === space.videoId;
                  return (
                    <div 
                      key={space.id} 
                      className={`relative group cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-[#5043F3] ring-offset-2 rounded-lg' : 'hover:scale-[1.02]'}`}
                      onClick={() => handleVideoClick(space.videoId)}
                    >
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 shadow-md group-hover:shadow-xl transition-all duration-300">
                        <img
                          src={getYouTubeThumbnail(space.videoId)}
                          alt={space.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        {space.badge && (
                          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-lg">
                            {space.badge}
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-[#5043F3]/30 flex items-center justify-center backdrop-blur-[2px]">
                            <div className="bg-[#5043F3] rounded-full p-2.5 shadow-lg animate-pulse">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(space.videoId);
                          }}
                          className={`absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 z-10 shadow-md ${
                            isFavorite(space.videoId)
                              ? 'bg-red-500 hover:bg-red-600 scale-110'
                              : 'bg-white/95 hover:bg-white backdrop-blur-sm'
                          }`}
                          title={isFavorite(space.videoId) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <svg 
                            className={`w-4.5 h-4.5 ${isFavorite(space.videoId) ? 'text-white' : 'text-gray-600'}`} 
                            fill={isFavorite(space.videoId) ? "currentColor" : "none"} 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </button>
                      </div>
                      <p className={`mt-2.5 text-sm font-semibold line-clamp-1 transition-colors ${isSelected ? 'text-[#5043F3]' : 'text-gray-900'}`}>{space.name}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            )}

            {activeTab === 'Images' && (
              <div className="mb-6">
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm font-medium">Images coming soon</p>
                </div>
              </div>
            )}

            {activeTab === 'Favorites' && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">Favorite Spaces</h3>
                {filteredSpaces.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {filteredSpaces.map((space) => {
                      const isSelected = backgroundVideoId === space.videoId;
                      return (
                        <div 
                          key={space.id} 
                          className={`relative group cursor-pointer transition-all duration-200 ${isSelected ? 'ring-2 ring-[#5043F3] ring-offset-2 rounded-lg' : 'hover:scale-[1.02]'}`}
                          onClick={() => handleVideoClick(space.videoId)}
                        >
                          <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 shadow-md group-hover:shadow-xl transition-all duration-300">
                            <img
                              src={getYouTubeThumbnail(space.videoId)}
                              alt={space.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            {space.badge && (
                              <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-lg">
                                {space.badge}
                              </div>
                            )}
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#5043F3]/30 flex items-center justify-center backdrop-blur-[2px]">
                                <div className="bg-[#5043F3] rounded-full p-2.5 shadow-lg animate-pulse">
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              </div>
                            )}
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
                          <p className={`mt-2.5 text-sm font-semibold line-clamp-1 transition-colors ${isSelected ? 'text-[#5043F3]' : 'text-gray-900'}`}>{space.name}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-sm">No favorites yet. Click the heart icon on any video to add it to favorites.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Currently Playing Footer */}
        <div className="border-t border-gray-200 bg-gradient-to-b from-gray-50 to-white p-5 shadow-lg">
          {currentSpace ? (
            <>
              {/* Current Video Info */}
              <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-gray-900">{currentSpace.name}</span>
                  {currentSpace.badge && (
                    <span className="bg-[#5043F3] text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm">{currentSpace.badge}</span>
                  )}
            </div>
            <div className="flex items-center gap-3">
              <button className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1.5 transition-all duration-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </button>
              <button 
                onClick={() => {
                  if (currentSpace) {
                    toggleFavorite(currentSpace.videoId);
                  }
                }}
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  currentSpace && isFavorite(currentSpace.videoId)
                    ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
                    : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title={currentSpace && isFavorite(currentSpace.videoId) ? "Remove from favorites" : "Add to favorites"}
              >
                <svg 
                  className="w-5 h-5" 
                  fill={currentSpace && isFavorite(currentSpace.videoId) ? "currentColor" : "none"} 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#5043F3] font-medium mb-4">
            <span>@Community</span>
            <button className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
          </div>
              {/* Volume Controls */}
          <div className="flex items-center gap-4">
                <button 
                  onClick={() => setVolume(volume > 0 ? 0 : 50)}
                  className="flex-shrink-0 text-slate-600 hover:text-slate-900 transition-colors p-1"
                >
                  {volume === 0 ? (
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
                    className="flex-1 h-0.5 bg-slate-200 rounded-full relative cursor-pointer group"
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
                      className="absolute left-0 top-0 h-full bg-[#5043F3] rounded-full"
                      style={{ width: `${volume}%`, transition: 'none' }}
                    ></div>
                    <div 
                      className="absolute w-3.5 h-3.5 bg-[#5043F3] rounded-full -translate-y-1/2 top-1/2 cursor-pointer hover:bg-[#3d35c4] hover:scale-110 transition-transform opacity-0 group-hover:opacity-100 shadow-sm border border-white"
                      style={{ left: `calc(${volume}% - 7px)`, transition: 'left 0s' }}
                    ></div>
                    <div 
                      className="absolute w-2.5 h-2.5 bg-[#5043F3] rounded-full -translate-y-1/2 top-1/2 cursor-pointer"
                      style={{ left: `calc(${volume}% - 5px)`, transition: 'none' }}
                    ></div>
                  </div>
                  <span className="flex-shrink-0 text-base font-medium text-slate-900 tabular-nums min-w-[3rem] text-right tracking-tight">{Math.round(volume)}%</span>
                </div>
          </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 text-center py-3">
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
    </>
  );
}

