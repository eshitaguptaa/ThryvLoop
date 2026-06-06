'use client';

import { useFocus } from '@/contexts/FocusContext';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserStorageItem, setUserStorageItem } from '@/utils/userStorage';
import { DEFAULT_SPACES_VIDEO_ID } from '@/lib/spacesConstants';

const DEFAULT_VIDEO_ID = DEFAULT_SPACES_VIDEO_ID;

function getYouTubeEmbedUrl(videoId) {
  if (!videoId) return null;
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    loop: '1',
    playlist: videoId,
    controls: '0',
    modestbranding: '1',
    rel: '0',
    enablejsapi: '1',
    origin: typeof window !== 'undefined' ? window.location.origin : '',
    iv_load_policy: '3',
    fs: '0',
    cc_load_policy: '0',
    playsinline: '1',
  });
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

function loadYouTubeIframeApi() {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return;
    if (window.YT?.Player) {
      resolve();
      return;
    }
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT?.Player) resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
    const poll = setInterval(() => {
      if (window.YT?.Player) {
        clearInterval(poll);
        resolve();
      }
    }, 100);
  });
}

export default function SpacesBackgroundVideo() {
  const pathname = usePathname();
  const isOnFocusRoute = pathname?.startsWith('/focus');
  const { backgroundVideoId, volume } = useFocus();
  const { user } = useUser();
  const userId = user?.id || null;
  const playerRef = useRef(null);
  const iframeRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [playerActivated, setPlayerActivated] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(
    () => backgroundVideoId || DEFAULT_VIDEO_ID
  );
  const currentVideoIdRef = useRef(currentVideoId);
  const playbackPositionIntervalRef = useRef(null);
  const volumeRef = useRef(volume);
  const playbackVolumeRef = useRef(null);

  volumeRef.current = volume;

  useEffect(() => {
    currentVideoIdRef.current = currentVideoId;
  }, [currentVideoId]);

  useEffect(() => {
    const nextId = backgroundVideoId || DEFAULT_VIDEO_ID;
    if (nextId !== currentVideoId) {
      setCurrentVideoId(nextId);
      if (playerRef.current?.loadVideoById) {
        try {
          playerRef.current.loadVideoById(nextId);
        } catch (e) {
          console.error('Error loading video by id:', e);
        }
      }
    }
  }, [backgroundVideoId, currentVideoId]);

  useEffect(() => {
    if (isOnFocusRoute) {
      setPlayerActivated(true);
    }
  }, [isOnFocusRoute]);

  useEffect(() => {
    const activate = () => setPlayerActivated(true);
    window.addEventListener('focus-spaces-activate', activate);
    return () => window.removeEventListener('focus-spaces-activate', activate);
  }, []);

  const isSpacesPausedByUser = () => {
    if (typeof window === 'undefined' || !userId) return false;
    return (
      getUserStorageItem(userId, 'focus-spaces-paused', 'focus-spaces-paused') === 'true'
    );
  };

  const shouldRunPlayer = () => playerActivated;

  const getPlaybackVolume = () => {
    if (!shouldRunPlayer()) return 0;
    if (playbackVolumeRef.current !== null) return playbackVolumeRef.current;
    if (isOnFocusRoute && !isSpacesPausedByUser()) return volumeRef.current;
    return 0;
  };

  const applyPlayerVolume = useCallback((player = playerRef.current, volumeOverride) => {
    if (!player || typeof player.setVolume !== 'function') return;
    const effectiveVolume =
      volumeOverride !== undefined ? volumeOverride : getPlaybackVolume();
    try {
      player.setVolume(effectiveVolume);
      if (typeof player.mute === 'function' && typeof player.unMute === 'function') {
        if (effectiveVolume > 0) {
          player.unMute();
        } else {
          player.mute();
        }
      }
    } catch (e) {
      console.error('Error setting volume:', e);
    }
  }, []);

  const startPlayback = useCallback((player = playerRef.current) => {
    if (!player || !shouldRunPlayer()) return;
    try {
      applyPlayerVolume(player);
      if (typeof player.unMute === 'function' && getPlaybackVolume() > 0) {
        player.unMute();
      }
      if (typeof player.playVideo === 'function') {
        player.playVideo();
      }
    } catch (e) {
      console.error('Error starting playback:', e);
    }
  }, [applyPlayerVolume]);

  const savePlaybackPosition = (videoId, time) => {
    if (typeof window === 'undefined' || !videoId) return;
    try {
      setUserStorageItem(userId, `focus-video-position-${videoId}`, time.toString());
    } catch (e) {
      console.error('Error saving playback position:', e);
    }
  };

  const destroyPlayer = () => {
    if (playbackPositionIntervalRef.current) {
      clearInterval(playbackPositionIntervalRef.current);
      playbackPositionIntervalRef.current = null;
    }
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.error('Error destroying player:', e);
      }
      playerRef.current = null;
    }
  };

  const attachPlayerApi = useCallback(
    (videoId) => {
      if (!iframeRef.current || playerRef.current) return;
      if (!window.YT?.Player) return;

      try {
        playerRef.current = new window.YT.Player(iframeRef.current, {
          events: {
            onReady: (event) => {
              setPlayerReady(true);
              if (playbackVolumeRef.current === null && !isSpacesPausedByUser()) {
                playbackVolumeRef.current = volumeRef.current;
              }
              startPlayback(event.target);
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
                setIsVideoPlaying(true);
              } else if (
                event.data === window.YT.PlayerState.BUFFERING ||
                event.data === window.YT.PlayerState.PAUSED ||
                event.data === window.YT.PlayerState.CUED
              ) {
                setIsVideoPlaying(false);
                if (
                  shouldRunPlayer() &&
                  (event.data === window.YT.PlayerState.PAUSED ||
                    event.data === window.YT.PlayerState.CUED)
                ) {
                  setTimeout(() => startPlayback(event.target), 150);
                }
              }
            },
            onError: () => {
              setIsVideoPlaying(false);
              if (videoId !== DEFAULT_VIDEO_ID) {
                setCurrentVideoId(DEFAULT_VIDEO_ID);
              }
            },
          },
        });
      } catch (e) {
        console.error('Error attaching YouTube player API:', e);
      }
    },
    [startPlayback]
  );

  useEffect(() => {
    if (!playerActivated) return undefined;
    loadYouTubeIframeApi().then(() => {
      attachPlayerApi(currentVideoIdRef.current);
    });
    return () => destroyPlayer();
  }, [playerActivated, attachPlayerApi]);

  useEffect(() => {
    const handleVideoChange = (e) => {
      const newVideoId = e.detail?.videoId || DEFAULT_VIDEO_ID;
      if (newVideoId !== currentVideoIdRef.current) {
        setCurrentVideoId(newVideoId);
        if (playerRef.current?.loadVideoById) {
          try {
            playerRef.current.loadVideoById(newVideoId);
          } catch (err) {
            console.error('Error switching video:', err);
          }
        }
      }
    };
    window.addEventListener('focus-video-changed', handleVideoChange);
    return () => window.removeEventListener('focus-video-changed', handleVideoChange);
  }, []);

  useEffect(() => {
    if (!playerActivated || !isOnFocusRoute) return;
    if (!isSpacesPausedByUser() && playbackVolumeRef.current === null) {
      playbackVolumeRef.current = volumeRef.current;
    }
    startPlayback();
    window.dispatchEvent(new CustomEvent('focus-spaces-player-ready'));
  }, [playerActivated, isOnFocusRoute, volume, applyPlayerVolume, startPlayback]);

  useEffect(() => {
    if (!playerReady || !playerRef.current || !isOnFocusRoute) return;
    if (isSpacesPausedByUser()) return;
    const vol = playbackVolumeRef.current ?? volumeRef.current;
    if (vol > 0) {
      playbackVolumeRef.current = vol;
      applyPlayerVolume(playerRef.current, vol);
    }
  }, [playerReady, isOnFocusRoute, volume, applyPlayerVolume]);

  useEffect(() => {
    const handleVolumeChange = (e) => {
      if (e.detail?.playbackOnly) {
        if (e.detail?.volume !== undefined) {
          if (e.detail.volume > 0) {
            setPlayerActivated(true);
          }
          playbackVolumeRef.current = e.detail.volume;
          applyPlayerVolume(playerRef.current, e.detail.volume);
        }
        return;
      }
    };
    window.addEventListener('focus-volume-changed', handleVolumeChange);
    return () => window.removeEventListener('focus-volume-changed', handleVolumeChange);
  }, [applyPlayerVolume]);

  const handleIframeLoad = () => {
    setPlayerReady(true);
    setIsVideoPlaying(true);
    loadYouTubeIframeApi().then(() => attachPlayerApi(currentVideoIdRef.current));
  };

  const showLoadingOverlay = isOnFocusRoute && (!playerReady || !isVideoPlaying);

  if (!playerActivated) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[1] w-screen h-screen overflow-hidden bg-black"
      style={{
        pointerEvents: isOnFocusRoute ? 'auto' : 'none',
        visibility: isOnFocusRoute ? 'visible' : 'hidden',
      }}
      aria-hidden={!isOnFocusRoute}
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
          onLoad={handleIframeLoad}
          className="h-full w-full border-0"
          title="Background Video"
        />
        {showLoadingOverlay && (
          <div
            className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(to bottom right, #111827, #000000, #111827)' }}
          >
            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="relative h-24 w-24">
                <div
                  className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-[#5043F3] border-r-purple-500"
                  style={{ animationDuration: '1.5s' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-[#5043F3]" />
                </div>
              </div>
              <p className="text-lg font-semibold tracking-wide text-white">Loading...</p>
            </div>
          </div>
        )}
      </div>
      {isOnFocusRoute && <div className="absolute inset-0 bg-black/10" />}
    </div>
  );
}
