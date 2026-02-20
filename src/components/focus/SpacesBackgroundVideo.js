'use client';

import { useFocus } from '@/contexts/FocusContext';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserStorageItem, setUserStorageItem } from '@/utils/userStorage';

const DEFAULT_VIDEO_ID = '1ZYbU82GVz4';

export default function SpacesBackgroundVideo() {
  const pathname = usePathname();
  const isOnFocusPage = pathname === '/focus';
  const { backgroundVideoId, volume } = useFocus();
  const { user } = useUser();
  const userId = user?.id || null;
  const playerRef = useRef(null);
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentVideoId, setCurrentVideoId] = useState(() => {
    const initialId = backgroundVideoId || DEFAULT_VIDEO_ID;
    return initialId;
  });
  const currentVideoIdRef = useRef(currentVideoId);
  const lastCustomEventVideoIdRef = useRef(null);
  const playbackPositionIntervalRef = useRef(null);
  const playerSetupForVideoIdRef = useRef(null);
  const fullSetupDoneRef = useRef(false);
  const volumeRef = useRef(volume);

  useEffect(() => {
    currentVideoIdRef.current = currentVideoId;
  }, [currentVideoId]);

  volumeRef.current = volume;

  const getSavedPlaybackPosition = (videoId) => {
    if (typeof window === 'undefined') return null;
    try {
      const saved = getUserStorageItem(userId, `focus-video-position-${videoId}`, `focus-video-position-${videoId}`);
      return saved ? parseFloat(saved) : null;
    } catch (e) {
      return null;
    }
  };

  const savePlaybackPosition = (videoId, time) => {
    if (typeof window === 'undefined' || !videoId) return;
    try {
      setUserStorageItem(userId, `focus-video-position-${videoId}`, time.toString());
    } catch (e) {
      console.error('Error saving playback position:', e);
    }
  };

  useEffect(() => {
    const handleVideoChange = (e) => {
      const newVideoId = e.detail?.videoId || DEFAULT_VIDEO_ID;
      if (newVideoId !== currentVideoIdRef.current) {
        lastCustomEventVideoIdRef.current = newVideoId;
        setIsLoading(true);
        if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
          try {
            playerRef.current.loadVideoById(newVideoId);
            setCurrentVideoId(newVideoId);
            return;
          } catch (error) {
            console.error('Error loading video in existing player, will recreate:', error);
          }
        }
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          try {
            const currentTime = playerRef.current.getCurrentTime();
            if (currentTime && currentTime > 0) {
              savePlaybackPosition(currentVideoIdRef.current, currentTime);
            }
          } catch (e) {}
        }
        if (playbackPositionIntervalRef.current) {
          clearInterval(playbackPositionIntervalRef.current);
          playbackPositionIntervalRef.current = null;
        }
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
      }
    };
    window.addEventListener('focus-video-changed', handleVideoChange);
    return () => window.removeEventListener('focus-video-changed', handleVideoChange);
  }, []);

  const getYouTubeEmbedUrl = (videoId) => {
    if (!videoId) return null;
    const params = new URLSearchParams({
      autoplay: '1',
      mute: '0',
      loop: '1',
      playlist: videoId,
      controls: '0',
      modestbranding: '1',
      rel: '0',
      enablejsapi: '1',
      origin: typeof window !== 'undefined' ? window.location.origin : '',
      iv_load_policy: '3',
      showinfo: '0',
      fs: '0',
      cc_load_policy: '0',
      playsinline: '1',
    });
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  useEffect(() => {
    const newVideoId = backgroundVideoId || DEFAULT_VIDEO_ID;
    if (lastCustomEventVideoIdRef.current && newVideoId === lastCustomEventVideoIdRef.current) {
      setTimeout(() => {
        lastCustomEventVideoIdRef.current = null;
      }, 1000);
      return;
    }
    if (lastCustomEventVideoIdRef.current && newVideoId !== lastCustomEventVideoIdRef.current) {
      return;
    }
    if (newVideoId !== currentVideoId) {
      setIsLoading(true);
      lastCustomEventVideoIdRef.current = null;
      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        try {
          playerRef.current.loadVideoById(newVideoId);
          setCurrentVideoId(newVideoId);
          return;
        } catch (error) {
          console.error('Error loading video in existing player, will recreate:', error);
        }
      }
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          if (currentTime && currentTime > 0) {
            savePlaybackPosition(currentVideoId, currentTime);
          }
        } catch (e) {}
      }
      if (playbackPositionIntervalRef.current) {
        clearInterval(playbackPositionIntervalRef.current);
        playbackPositionIntervalRef.current = null;
      }
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
    }
  }, [backgroundVideoId, currentVideoId]);

  useEffect(() => {
    fullSetupDoneRef.current = false;
    // Only destroy/recreate when video ID changes; volume changes are handled by the separate volume effect
    if (playerSetupForVideoIdRef.current === currentVideoId && playerRef.current) {
      return;
    }
    fullSetupDoneRef.current = true;
    playerSetupForVideoIdRef.current = currentVideoId;

    const videoIdToLoad = currentVideoId;
    // Delay so iframe is in DOM and can load (browsers need visible container for embed to load)
    const timer = setTimeout(() => {
      const currentVideo = currentVideoIdRef.current;
      if (currentVideo !== videoIdToLoad) return;
      if (!iframeRef.current) return;

      if (typeof window !== 'undefined' && !window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
          const videoId = currentVideoIdRef.current;
          if (videoId === videoIdToLoad && iframeRef.current && !playerRef.current) {
            createPlayer(videoId);
          }
        };
      } else if (window.YT && window.YT.Player) {
        if (!playerRef.current) {
          const videoId = currentVideoIdRef.current;
          if (videoId === videoIdToLoad) {
            createPlayer(videoId);
          }
        }
      }

      function createPlayer(videoId) {
        if (!iframeRef.current || playerRef.current) return;
        if (currentVideoIdRef.current !== videoId) return;

        try {
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
                const vol = volumeRef.current;
                if (vol !== undefined && typeof event.target.setVolume === 'function') {
                  try {
                    event.target.setVolume(vol);
                  } catch (e) {
                    console.error('Error setting volume on ready:', e);
                  }
                }
                savePlaybackPosition(videoId, 0);
                const ensureVideoPlays = () => {
                  try {
                    event.target.playVideo();
                  } catch (e) {
                    console.error('Error playing video:', e);
                  }
                  [300, 600, 1000, 2000, 3000].forEach((delay) => {
                    setTimeout(() => {
                      try {
                        if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
                          const state = playerRef.current.getPlayerState();
                          if (state !== window.YT.PlayerState.PLAYING && state !== window.YT.PlayerState.BUFFERING) {
                            playerRef.current.playVideo();
                          }
                        }
                      } catch (e) {}
                    }, delay);
                  });
                };
                ensureVideoPlays();
                const playCheckInterval = setInterval(() => {
                  try {
                    if (playerRef.current && typeof playerRef.current.getPlayerState === 'function') {
                      const state = playerRef.current.getPlayerState();
                      if (state === window.YT.PlayerState.PAUSED || state === window.YT.PlayerState.CUED) {
                        if (typeof playerRef.current.playVideo === 'function') {
                          playerRef.current.playVideo();
                        }
                      }
                    }
                  } catch (e) {}
                }, 2000);
                setTimeout(() => clearInterval(playCheckInterval), 30000);
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
                  } catch (e) {}
                }, 5000);
              },
              onStateChange: (event) => {
                if (event.data === window.YT.PlayerState.PLAYING) {
                  setTimeout(() => setIsLoading(false), 500);
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
                  try {
                    if (typeof event.target.getCurrentTime === 'function') {
                      const currentTime = event.target.getCurrentTime();
                      if (currentTime && currentTime > 0) {
                        savePlaybackPosition(videoId, currentTime);
                      }
                    }
                  } catch (e) {}
                } else if (event.data === window.YT.PlayerState.BUFFERING) {
                  setIsLoading(true);
                } else if (event.data === window.YT.PlayerState.PAUSED) {
                  setTimeout(() => {
                    try {
                      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
                        const state = playerRef.current.getPlayerState();
                        if (state === window.YT.PlayerState.PAUSED) {
                          playerRef.current.playVideo();
                        }
                      }
                    } catch (e) {}
                  }, 100);
                } else if (event.data === window.YT.PlayerState.CUED) {
                  setTimeout(() => {
                    try {
                      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
                        playerRef.current.playVideo();
                      }
                    } catch (e) {}
                  }, 200);
                } else if (event.data === window.YT.PlayerState.ENDED) {
                  savePlaybackPosition(videoId, 0);
                  try {
                    event.target.playVideo();
                  } catch (e) {
                    try {
                      event.target.loadVideoById(videoId);
                    } catch (e2) {}
                  }
                }
              },
              onError: (event) => {
                if (event.data === 150 || event.data === 101 || event.data === 100) {
                  if (videoId !== DEFAULT_VIDEO_ID) {
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

    return () => {
      clearTimeout(timer);
      if (!fullSetupDoneRef.current) return;
      fullSetupDoneRef.current = false;
      if (playbackPositionIntervalRef.current) {
        clearInterval(playbackPositionIntervalRef.current);
        playbackPositionIntervalRef.current = null;
      }
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          if (currentTime && currentTime > 0) {
            savePlaybackPosition(currentVideoId, currentTime);
          }
        } catch (e) {}
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
  }, [currentVideoId]);

  useEffect(() => {
    if (playerRef.current && volume !== undefined) {
      try {
        if (typeof playerRef.current.setVolume === 'function') {
          playerRef.current.setVolume(volume);
        }
      } catch (e) {
        console.error('Error setting volume:', e);
      }
    }
  }, [volume]);

  useEffect(() => {
    const handleVolumeChange = (e) => {
      const newVolume = e.detail?.volume;
      if (newVolume !== undefined && playerRef.current) {
        try {
          if (typeof playerRef.current.setVolume === 'function') {
            playerRef.current.setVolume(newVolume);
          }
        } catch (error) {
          console.error('Error setting volume from custom event:', error);
        }
      }
    };
    window.addEventListener('focus-volume-changed', handleVolumeChange);
    return () => window.removeEventListener('focus-volume-changed', handleVolumeChange);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = playerRef.current.getCurrentTime();
          const videoId = currentVideoIdRef.current;
          if (currentTime && currentTime > 0 && videoId) {
            savePlaybackPosition(videoId, currentTime);
          }
        } catch (e) {}
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, []);

  const handleContainerClick = () => {
    if (!isOnFocusPage) return;
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      try {
        const state = playerRef.current.getPlayerState();
        if (state === window.YT.PlayerState.PAUSED || state === window.YT.PlayerState.CUED) {
          playerRef.current.playVideo();
        }
      } catch (e) {
        console.error('Error playing video on click:', e);
      }
    }
  };

  // Keep opacity 1 always so the iframe loads (browsers suspend hidden iframes).
  // On non-focus pages the main content (z-10, solid bg) covers the video; pointer-events: none lets clicks through.
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
        cursor: isOnFocusPage ? 'default' : 'default',
        pointerEvents: isOnFocusPage ? 'auto' : 'none',
      }}
      aria-hidden={!isOnFocusPage}
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
            opacity: isLoading && isOnFocusPage ? 0 : 1,
            transition: 'opacity 0.5s ease-in-out',
          }}
          title="Background Video"
        />
        <div
          className="absolute bottom-0 right-0 w-40 h-24 pointer-events-none z-15"
          style={{
            background: 'linear-gradient(to top left, transparent 0%, transparent 30%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0.5) 100%)',
          }}
        />
        {isLoading && isOnFocusPage && (
          <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-black to-gray-900 z-20 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#5043F3]/20 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>
            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 border-4 border-transparent border-t-[#5043F3] border-r-purple-500 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
                <div className="absolute inset-2 border-4 border-transparent border-b-indigo-400 border-l-[#5043F3] rounded-full animate-spin" style={{ animationDuration: '1s', animationDirection: 'reverse' }}></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-[#5043F3] rounded-full animate-pulse shadow-lg shadow-[#5043F3]/50"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
                </div>
              </div>
              <p className="text-white text-lg font-semibold tracking-wide">Loading...</p>
            </div>
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '50px 50px',
              }}
            />
          </div>
        )}
      </div>
      {isOnFocusPage && <div className="absolute inset-0 bg-black/10" />}
    </div>
  );
}
