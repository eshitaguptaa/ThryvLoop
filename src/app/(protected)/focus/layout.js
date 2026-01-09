'use client';

import { FocusProvider, useFocus } from '@/contexts/FocusContext';
import { useEffect, useRef, useState } from 'react';

const DEFAULT_VIDEO_ID = '1ZYbU82GVz4';

function BackgroundVideo() {
  const { backgroundVideoId, volume } = useFocus();
  const playerRef = useRef(null);
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentVideoId, setCurrentVideoId] = useState(() => {
    const initialId = backgroundVideoId || DEFAULT_VIDEO_ID;
    console.log('BackgroundVideo initial render, videoId:', initialId);
    return initialId;
  });
  const currentVideoIdRef = useRef(currentVideoId);
  const lastCustomEventVideoIdRef = useRef(null); // Track last video from custom event
  const playbackPositionIntervalRef = useRef(null); // Track position saving interval

  // Keep ref in sync with state
  useEffect(() => {
    currentVideoIdRef.current = currentVideoId;
  }, [currentVideoId]);

  // Load saved playback position on mount
  const getSavedPlaybackPosition = (videoId) => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = localStorage.getItem(`focus-video-position-${videoId}`);
      return saved ? parseFloat(saved) : null;
    } catch (e) {
      return null;
    }
  };

  // Save playback position to localStorage
  const savePlaybackPosition = (videoId, time) => {
    if (typeof window === 'undefined' || !videoId) return;
    try {
      localStorage.setItem(`focus-video-position-${videoId}`, time.toString());
    } catch (e) {
      console.error('Error saving playback position:', e);
    }
  };

  // Log when backgroundVideoId changes from context
  useEffect(() => {
    console.log('BackgroundVideo - backgroundVideoId from context:', backgroundVideoId);
  }, [backgroundVideoId]);

  // Listen to custom event from SpacesDrawer (works even if context is not available to drawer)
  // This takes precedence over context updates
  useEffect(() => {
    const handleVideoChange = (e) => {
      const newVideoId = e.detail?.videoId || DEFAULT_VIDEO_ID;
      console.log('Custom event: Video changed to:', newVideoId, 'Current:', currentVideoIdRef.current);
      // Use ref to get current value without needing it in dependency array
      if (newVideoId !== currentVideoIdRef.current) {
        lastCustomEventVideoIdRef.current = newVideoId; // Remember this was from custom event
        console.log('Updating video from custom event to:', newVideoId);
        setIsLoading(true);
        
        // Try to use loadVideoById if player exists, otherwise recreate
        if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
          try {
            console.log('Loading new video in existing player:', newVideoId);
            playerRef.current.loadVideoById(newVideoId);
            // Update state to reflect the change
            setCurrentVideoId(newVideoId);
            // Don't destroy player - just load new video
            return;
          } catch (error) {
            console.error('Error loading video in existing player, will recreate:', error);
            // Fall through to recreate player
          }
        }
        
        // Save current position before switching videos
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          try {
            const currentTime = playerRef.current.getCurrentTime();
            if (currentTime && currentTime > 0) {
              savePlaybackPosition(currentVideoIdRef.current, currentTime);
            }
          } catch (e) {
            // Ignore errors
          }
        }
        
        // Clear position saving interval
        if (playbackPositionIntervalRef.current) {
          clearInterval(playbackPositionIntervalRef.current);
          playbackPositionIntervalRef.current = null;
        }
        
        // Destroy existing player if loadVideoById failed or player doesn't exist
        if (playerRef.current) {
          try {
            if (typeof playerRef.current.destroy === 'function') {
              playerRef.current.destroy();
            }
          } catch (e) {
            console.error('Error destroying player:', e);
          }
          playerRef.current = null;
        }
        
        setCurrentVideoId(newVideoId);
      } else {
        console.log('Video already set to:', newVideoId);
      }
    };

    window.addEventListener('focus-video-changed', handleVideoChange);

    return () => {
      window.removeEventListener('focus-video-changed', handleVideoChange);
    };
  }, []); // Empty dependency array - handler uses ref to access current value

  // Get YouTube embed URL
  const getYouTubeEmbedUrl = (videoId) => {
    if (!videoId) return null;
    const params = new URLSearchParams({
      autoplay: '1',
      mute: '0',
      loop: '1', // Enable looping
      playlist: videoId, // Required for loop to work - must include the video ID
      controls: '0',
      modestbranding: '1',
      rel: '0',
      enablejsapi: '1',
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      iv_load_policy: '3', // Hide annotations
      showinfo: '0', // Hide video info
      fs: '0', // Disable fullscreen button
      cc_load_policy: '0', // Hide captions
      playsinline: '1', // Play inline on mobile
    });
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  // Update video when backgroundVideoId changes from context
  // Only update if it's different AND not from a recent custom event (to avoid reverting)
  useEffect(() => {
    const newVideoId = backgroundVideoId || DEFAULT_VIDEO_ID;
    
    // Don't revert if we just set a video via custom event and context matches it
    if (lastCustomEventVideoIdRef.current && newVideoId === lastCustomEventVideoIdRef.current) {
      console.log('Context update matches custom event video - no change needed');
      // Clear the ref after a short delay to allow normal context updates later
      setTimeout(() => {
        lastCustomEventVideoIdRef.current = null;
      }, 1000);
      return;
    }
    
    // Don't update if context has old/stale value and we have a newer custom event value
    if (lastCustomEventVideoIdRef.current && newVideoId !== lastCustomEventVideoIdRef.current) {
      console.log('Ignoring context update - custom event has newer video:', {
        contextVideo: newVideoId,
        customEventVideo: lastCustomEventVideoIdRef.current,
        currentVideo: currentVideoIdRef.current
      });
      return;
    }
    
    if (newVideoId !== currentVideoId) {
      console.log('Video change detected from context:', { from: currentVideoId, to: newVideoId });
      setIsLoading(true);
      
      // Clear the custom event ref since we're updating from context
      lastCustomEventVideoIdRef.current = null;
      
      // Try to use loadVideoById if player exists, otherwise recreate
      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        try {
          console.log('Loading new video in existing player from context:', newVideoId);
          playerRef.current.loadVideoById(newVideoId);
          // Update state to reflect the change
          setCurrentVideoId(newVideoId);
          // Don't destroy player - just load new video
          return;
        } catch (error) {
          console.error('Error loading video in existing player, will recreate:', error);
          // Fall through to recreate player
        }
      }
      
      // Save current position before switching videos
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          if (currentTime && currentTime > 0) {
            savePlaybackPosition(currentVideoId, currentTime);
          }
        } catch (e) {
          // Ignore errors
        }
      }
      
      // Clear position saving interval
      if (playbackPositionIntervalRef.current) {
        clearInterval(playbackPositionIntervalRef.current);
        playbackPositionIntervalRef.current = null;
      }
      
      // Destroy existing player if loadVideoById failed or player doesn't exist
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.destroy === 'function') {
            playerRef.current.destroy();
          }
        } catch (e) {
          console.error('Error destroying player:', e);
        }
        playerRef.current = null;
      }
      
      // Update current video ID - this will trigger iframe recreation via key prop
      setCurrentVideoId(newVideoId);
    }
  }, [backgroundVideoId, currentVideoId]);

  // Initialize YouTube Player API
  useEffect(() => {
    // Get the current video ID at the time this effect runs
    const videoIdToLoad = currentVideoId;
    console.log('Player initialization effect running for video:', videoIdToLoad);
    
    // Small delay to ensure iframe is mounted when key changes
    const timer = setTimeout(() => {
      // Double-check the video ID is still the same (in case it changed during the delay)
      const currentVideo = currentVideoIdRef.current;
      if (currentVideo !== videoIdToLoad) {
        console.log('Video changed during initialization delay, aborting. Expected:', videoIdToLoad, 'Current:', currentVideo);
        return;
      }
      
      if (!iframeRef.current) {
        console.log('Iframe ref not available yet');
        return;
      }

      // Load YouTube IFrame API if not already loaded
      if (typeof window !== 'undefined' && !window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
          const videoId = currentVideoIdRef.current;
          console.log('YouTube API ready, creating player for video:', videoId);
          // Only create if video ID matches what we're trying to load
          if (videoId === videoIdToLoad && iframeRef.current && !playerRef.current) {
            createPlayer(videoId);
          } else {
            console.log('Skipping player creation - video changed or player exists', { videoId, videoIdToLoad, hasIframe: !!iframeRef.current, hasPlayer: !!playerRef.current });
          }
        };
      } else if (window.YT && window.YT.Player) {
        // API already loaded
        if (!playerRef.current) {
          const videoId = currentVideoIdRef.current;
          // Only create if video ID matches
          if (videoId === videoIdToLoad) {
            console.log('Creating player for video:', videoId);
            createPlayer(videoId);
          } else {
            console.log('Skipping player creation - video changed', { videoId, videoIdToLoad });
          }
        }
      }

      function createPlayer(videoId) {
        if (!iframeRef.current || playerRef.current) {
          console.log('Cannot create player - iframe or player already exists');
          return;
        }
        
        // Final check that video ID matches
        if (currentVideoIdRef.current !== videoId) {
          console.log('Video ID mismatch, aborting player creation', { expected: videoId, current: currentVideoIdRef.current });
          return;
        }

        try {
          console.log('Initializing YouTube player with video:', videoId);
          playerRef.current = new window.YT.Player(iframeRef.current, {
            videoId: videoId,
            playerVars: {
              autoplay: 1,
              mute: 0,
              loop: 1,
              playlist: videoId,
              controls: 0,
              modestbranding: 1,
              rel: 0,
              enablejsapi: 1,
              origin: window.location.origin,
              showinfo: 0,
              fs: 0,
              cc_load_policy: 0,
              iv_load_policy: 3,
              playsinline: 1,
            },
            events: {
              onReady: (event) => {
                console.log('Player ready for video:', videoId);
                // Don't hide loading yet - wait until video is actually playing
                // This prevents YouTube logo from showing
                // Set quality
                try {
                  event.target.setPlaybackQuality('hd2160');
                } catch (e) {
                  try {
                    event.target.setPlaybackQuality('hd1080');
                  } catch (e2) {
                    try {
                      event.target.setPlaybackQuality('hd720');
                    } catch (e3) {}
                  }
                }
                // Set volume when player is ready
                if (volume !== undefined && typeof event.target.setVolume === 'function') {
                  try {
                    event.target.setVolume(volume);
                  } catch (e) {
                    console.error('Error setting volume on ready:', e);
                  }
                }
                
                // Always start from beginning and ensure video plays
                // Clear any saved position to start fresh
                savePlaybackPosition(videoId, 0);
                
                // Play the video immediately with aggressive retry attempts
                const ensureVideoPlays = () => {
                  // Immediate play attempt
                  try {
                    event.target.playVideo();
                  } catch (e) {
                    console.error('Error playing video:', e);
                  }
                  
                  // Multiple retry attempts at different intervals
                  const retryIntervals = [300, 600, 1000, 2000, 3000];
                  retryIntervals.forEach((delay) => {
                    setTimeout(() => {
                      try {
                        if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
                          const state = playerRef.current.getPlayerState();
                          if (state !== window.YT.PlayerState.PLAYING && 
                              state !== window.YT.PlayerState.BUFFERING) {
                            console.log(`Video not playing at ${delay}ms, retrying. State:`, state);
                            playerRef.current.playVideo();
                          }
                        }
                      } catch (e) {
                        console.error(`Error in retry at ${delay}ms:`, e);
                      }
                    }, delay);
                  });
                };
                
                // Start playing immediately
                ensureVideoPlays();
                
                // Also set up a periodic check to ensure it stays playing
                const playCheckInterval = setInterval(() => {
                  try {
                    if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
                      const state = playerRef.current.getPlayerState();
                      if (state === window.YT.PlayerState.PAUSED || 
                          state === window.YT.PlayerState.CUED) {
                        console.log('Video paused/cued, forcing play. State:', state);
                        if (typeof playerRef.current.playVideo === 'function') {
                          playerRef.current.playVideo();
                        }
                      }
                    }
                  } catch (e) {
                    // Ignore errors
                  }
                }, 2000); // Check every 2 seconds
                
                // Clear interval when component unmounts or video changes
                setTimeout(() => {
                  clearInterval(playCheckInterval);
                }, 30000); // Stop checking after 30 seconds (video should be playing by then)

                // Start saving playback position periodically (every 5 seconds)
                if (playbackPositionIntervalRef.current) {
                  clearInterval(playbackPositionIntervalRef.current);
                }
                playbackPositionIntervalRef.current = setInterval(() => {
                  try {
                    if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                      const currentTime = playerRef.current.getCurrentTime();
                      if (currentTime && currentTime > 0) {
                        savePlaybackPosition(videoId, currentTime);
                      }
                    }
                  } catch (e) {
                    console.error('Error getting current time:', e);
                  }
                }, 5000); // Save every 5 seconds
              },
              onStateChange: (event) => {
                if (event.data === window.YT.PlayerState.PLAYING) {
                  // Hide loading overlay only when video is actually playing
                  // Add small delay to ensure video has fully started and YouTube logo is gone
                  setTimeout(() => {
                    setIsLoading(false);
                  }, 500); // Wait 500ms after playing starts to hide overlay
                  // Set quality when playing
                  try {
                    event.target.setPlaybackQuality('hd2160');
                  } catch (e) {
                    try {
                      event.target.setPlaybackQuality('hd1080');
                    } catch (e2) {
                      try {
                        event.target.setPlaybackQuality('hd720');
                      } catch (e3) {}
                    }
                  }
                  // Save position when playing (more frequently)
                  try {
                    if (typeof event.target.getCurrentTime === 'function') {
                      const currentTime = event.target.getCurrentTime();
                      if (currentTime && currentTime > 0) {
                        savePlaybackPosition(videoId, currentTime);
                      }
                    }
                  } catch (e) {
                    // Ignore errors
                  }
                } else if (event.data === window.YT.PlayerState.BUFFERING) {
                  setIsLoading(true);
                } else if (event.data === window.YT.PlayerState.PAUSED) {
                  // If video is paused, automatically play it (especially on page load)
                  console.log('Video paused, forcing play');
                  setTimeout(() => {
                    try {
                      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
                        const state = playerRef.current.getPlayerState();
                        if (state === window.YT.PlayerState.PAUSED) {
                          console.log('Video still paused, playing now');
                          playerRef.current.playVideo();
                        }
                      }
                    } catch (e) {
                      console.error('Error forcing play from paused state:', e);
                    }
                  }, 100);
                } else if (event.data === window.YT.PlayerState.CUED) {
                  // Video is cued but not playing, force play
                  console.log('Video cued, forcing play');
                  setTimeout(() => {
                    try {
                      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
                        playerRef.current.playVideo();
                      }
                    } catch (e) {
                      console.error('Error playing cued video:', e);
                    }
                  }, 200);
                } else if (event.data === window.YT.PlayerState.ENDED) {
                  // If video ends, restart it immediately to ensure endless loop
                  console.log('Video ended, restarting to ensure endless loop');
                  // Clear saved position when video ends (since it will restart)
                  savePlaybackPosition(videoId, 0);
                  try {
                    event.target.playVideo();
                  } catch (e) {
                    console.error('Error restarting video:', e);
                    // Fallback: reload the video
                    try {
                      event.target.loadVideoById(videoId);
                    } catch (e2) {
                      console.error('Error reloading video:', e2);
                    }
                  }
                }
              },
              onError: (event) => {
                console.error('YouTube player error:', event.data);
                // Error 150: Video cannot be played in embedded players
                // Error 101: Video doesn't exist or is private
                // Error 100: Video not found
                if (event.data === 150 || event.data === 101 || event.data === 100) {
                  console.warn(`Video ${videoId} cannot be embedded or doesn't exist. Error code: ${event.data}`);
                  // Try to fall back to default video if current video fails
                  if (videoId !== DEFAULT_VIDEO_ID) {
                    console.log('Falling back to default video');
                    setTimeout(() => {
                      setCurrentVideoId(DEFAULT_VIDEO_ID);
                      setIsLoading(true);
                    }, 1000);
                  } else {
                    setIsLoading(false);
                  }
                } else {
                  setIsLoading(false);
                }
              },
            },
          });
        } catch (e) {
          console.error('Error creating YouTube player:', e);
          setIsLoading(false);
        }
      }
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(timer);
      // Clear position saving interval
      if (playbackPositionIntervalRef.current) {
        clearInterval(playbackPositionIntervalRef.current);
        playbackPositionIntervalRef.current = null;
      }
      // Save final position before cleanup
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          if (currentTime && currentTime > 0) {
            savePlaybackPosition(currentVideoId, currentTime);
          }
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error('Error destroying player in cleanup:', e);
        }
        playerRef.current = null;
      }
    };
  }, [currentVideoId, volume]);

  // Update volume when it changes from context
  useEffect(() => {
    if (playerRef.current && volume !== undefined) {
      try {
        // Check if player has setVolume method (player is ready)
        if (typeof playerRef.current.setVolume === 'function') {
          console.log('Setting video volume to:', volume);
          playerRef.current.setVolume(volume);
        }
      } catch (e) {
        console.error('Error setting volume:', e);
      }
    }
  }, [volume]);

  // Also listen to custom volume change events (fallback if context not available)
  useEffect(() => {
    const handleVolumeChange = (e) => {
      const newVolume = e.detail?.volume;
      if (newVolume !== undefined && playerRef.current) {
        try {
          if (typeof playerRef.current.setVolume === 'function') {
            console.log('Setting video volume from custom event to:', newVolume);
            playerRef.current.setVolume(newVolume);
          }
        } catch (error) {
          console.error('Error setting volume from custom event:', error);
        }
      }
    };

    window.addEventListener('focus-volume-changed', handleVolumeChange);

    return () => {
      window.removeEventListener('focus-volume-changed', handleVolumeChange);
    };
  }, []);

  // Save position before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const videoId = currentVideoIdRef.current;
          if (currentTime && currentTime > 0 && videoId) {
            savePlaybackPosition(videoId, currentTime);
          }
        } catch (e) {
          // Ignore errors
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, []);

  // Handle click to play if video is paused (for autoplay policy bypass)
  const handleContainerClick = () => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      try {
        const state = playerRef.current.getPlayerState();
        if (state === window.YT.PlayerState.PAUSED || 
            state === window.YT.PlayerState.CUED) {
          console.log('Container clicked, playing video');
          playerRef.current.playVideo();
        }
      } catch (e) {
        console.error('Error playing video on click:', e);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 z-0 w-screen h-screen overflow-hidden"
      onClick={handleContainerClick}
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        cursor: 'default',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '177.77777778vh',
          height: '100vh',
          minWidth: '100vw',
          minHeight: '56.25vw',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <iframe
          key={currentVideoId}
          ref={iframeRef}
          id="youtube-background-player"
          src={getYouTubeEmbedUrl(currentVideoId)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          style={{ 
            border: 0, 
            pointerEvents: 'none',
            width: '100%',
            height: '100%',
            opacity: isLoading ? 0 : 1,
            transition: 'opacity 0.5s ease-in-out',
          }}
          title="Background Video"
        />
        {/* Overlay to cover YouTube branding area (bottom right corner where logo appears) */}
        <div 
          className="absolute bottom-0 right-0 w-40 h-24 pointer-events-none z-15"
          style={{
            background: 'linear-gradient(to top left, transparent 0%, transparent 30%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.5) 100%)',
          }}
        />
        {/* Loading Animation - Keep visible until video is playing to hide YouTube logo */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 z-20 flex items-center justify-center overflow-hidden">
            {/* Animated background gradient orbs */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#5043F3]/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
            
            {/* Main loading content */}
            <div className="relative z-10 flex flex-col items-center gap-6">
              {/* Unique animated loader */}
              <div className="relative w-24 h-24">
                {/* Outer rotating ring */}
                <div className="absolute inset-0 border-4 border-transparent border-t-[#5043F3] border-r-purple-500 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
                {/* Middle ring */}
                <div className="absolute inset-2 border-4 border-transparent border-b-indigo-400 border-l-[#5043F3] rounded-full animate-spin" style={{ animationDuration: '1s', animationDirection: 'reverse' }}></div>
                {/* Inner pulsing dot */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-[#5043F3] rounded-full animate-pulse shadow-lg shadow-[#5043F3]/50"></div>
                </div>
                {/* Glowing center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                </div>
              </div>
              
              {/* Loading text with animation */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-white text-lg font-semibold tracking-wide">
                  <span className="inline-block animate-pulse">L</span>
                  <span className="inline-block animate-pulse" style={{ animationDelay: '0.1s' }}>o</span>
                  <span className="inline-block animate-pulse" style={{ animationDelay: '0.2s' }}>a</span>
                  <span className="inline-block animate-pulse" style={{ animationDelay: '0.3s' }}>d</span>
                  <span className="inline-block animate-pulse" style={{ animationDelay: '0.4s' }}>i</span>
                  <span className="inline-block animate-pulse" style={{ animationDelay: '0.5s' }}>n</span>
                  <span className="inline-block animate-pulse" style={{ animationDelay: '0.6s' }}>g</span>
                  <span className="inline-block animate-pulse ml-2" style={{ animationDelay: '0.7s' }}>.</span>
                  <span className="inline-block animate-pulse" style={{ animationDelay: '0.8s' }}>.</span>
                  <span className="inline-block animate-pulse" style={{ animationDelay: '0.9s' }}>.</span>
                </p>
                <div className="flex gap-1 mt-2">
                  <div className="w-1.5 h-1.5 bg-[#5043F3] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
            
            {/* Subtle grid pattern overlay */}
            <div 
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px'
              }}
            ></div>
          </div>
        )}
      </div>
      {/* Overlay for better widget visibility */}
      <div className="absolute inset-0 bg-black/10"></div>
    </div>
  );
}

export default function FocusLayout({ children }) {
  return (
    <FocusProvider>
      <div className="relative min-h-screen">
        <BackgroundVideo />
        
        {/* Content overlay */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </FocusProvider>
  );
}
