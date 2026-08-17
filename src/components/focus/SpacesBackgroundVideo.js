'use client';

import { useFocus } from '@/contexts/FocusContext';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserStorageItem, setUserStorageItem } from '@/utils/userStorage';
import { DEFAULT_SPACES_VIDEO_ID, resolveSpacesVideoId } from '@/lib/spacesConstants';
import { isSpacesPausedByUser, isSpacesPlaybackIntent, hasSpacesMediaConfigured, shouldShowSpacesBackground } from '@/lib/spacesPlayback';
import { loadYouTubeIframeApi } from '@/lib/youtubeIframeApi';
import { buildYouTubeEmbedUrl, YOUTUBE_IFRAME_ALLOW, YOUTUBE_IFRAME_REFERRER_POLICY } from '@/lib/youtubeEmbed';

const DEFAULT_VIDEO_ID = DEFAULT_SPACES_VIDEO_ID;

export default function SpacesBackgroundVideo() {
  const pathname = usePathname();
  const isOnFocusRoute = pathname?.startsWith('/focus');
  const { backgroundVideoId, volume } = useFocus();
  const { user } = useUser();
  const userId = user?.id || null;
  const playerRef = useRef(null);
  const iframeRef = useRef(null);
  const shellRef = useRef(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [playerActivated, setPlayerActivated] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState(
    () => resolveSpacesVideoId(backgroundVideoId)
  );
  const currentVideoIdRef = useRef(currentVideoId);
  const embedSrcRef = useRef(buildYouTubeEmbedUrl(currentVideoId));
  const playbackPositionIntervalRef = useRef(null);
  const pendingVideoSwitchRef = useRef(false);
  const volumeRef = useRef(volume);
  const spacesBaseVolumeRef = useRef(volume);
  const playbackVolumeRef = useRef(null);
  const userIdRef = useRef(userId);
  const attachPlayerApiRef = useRef(null);
  const applyPlayerVolumeRef = useRef(null);
  const startPlaybackRef = useRef(null);
  const restoreAudioAfterVideoSwitchRef = useRef(null);
  const audioSyncTimeoutRef = useRef(null);
  const volumeRampIntervalRef = useRef(null);
  const pendingSpacesPlaybackRef = useRef(false);

  volumeRef.current = volume;
  spacesBaseVolumeRef.current = volume;
  userIdRef.current = userId;

  useEffect(() => {
    currentVideoIdRef.current = currentVideoId;
  }, [currentVideoId]);

  useEffect(() => {
    const activate = () => {
      setPlayerActivated(true);
      void loadYouTubeIframeApi();
    };
    window.addEventListener('focus-spaces-activate', activate);
    return () => window.removeEventListener('focus-spaces-activate', activate);
  }, []);

  const isSpacesPaused = useCallback(() => {
    return isSpacesPausedByUser(userIdRef.current);
  }, []);

  const isSpacesPlaybackActive = useCallback(() => {
    return isSpacesPlaybackIntent(userIdRef.current);
  }, []);

  const shouldRunPlayer = () => playerActivated;

  const getMasterAdjustedBaseVolume = useCallback(() => {
    const base = spacesBaseVolumeRef.current;
    if (!userIdRef.current || base <= 0) return base;
    const raw = getUserStorageItem(
      userIdRef.current,
      'soundscape-global-volume',
      'soundscape-global-volume'
    );
    const parsed = raw ? parseInt(raw, 10) : 75;
    const master = Number.isNaN(parsed) ? 75 : Math.max(0, Math.min(100, parsed));
    return Math.round(base * (master / 100));
  }, []);

  const resolvePlaybackVolume = useCallback(() => {
    if (isSpacesPaused()) return 0;
    if (!isSpacesPlaybackActive()) return 0;
    if (spacesBaseVolumeRef.current <= 0) return 0;
    const ducked = playbackVolumeRef.current;
    if (ducked === null || ducked === undefined) return getMasterAdjustedBaseVolume();
    // Transient duck from layering — restore base level unless user muted via slider
    if (ducked === 0) return getMasterAdjustedBaseVolume();
    return ducked;
  }, [isSpacesPaused, isSpacesPlaybackActive, getMasterAdjustedBaseVolume]);

  const getPlaybackVolume = useCallback(() => {
    if (!shouldRunPlayer()) return 0;
    return resolvePlaybackVolume();
  }, [resolvePlaybackVolume]);

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
  }, [getPlaybackVolume]);

  const clearVolumeRamp = useCallback(() => {
    if (volumeRampIntervalRef.current) {
      clearInterval(volumeRampIntervalRef.current);
      volumeRampIntervalRef.current = null;
    }
  }, []);

  const rampPlayerVolume = useCallback((player = playerRef.current, targetVolume, durationMs = 280) => {
    if (!player || typeof player.setVolume !== 'function') return;
    clearVolumeRamp();

    if (targetVolume <= 0) {
      applyPlayerVolume(player, 0);
      return;
    }

    let startVolume = 0;
    try {
      if (typeof player.getVolume === 'function') {
        startVolume = player.getVolume();
      }
    } catch {
      startVolume = 0;
    }

    try {
      if (typeof player.unMute === 'function') player.unMute();
      if (typeof player.playVideo === 'function') player.playVideo();
    } catch (e) {
      console.error('Error starting Spaces playback for ramp:', e);
    }

    const startTime = Date.now();
    volumeRampIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = progress * progress;
      const nextVolume = startVolume + (targetVolume - startVolume) * eased;

      try {
        player.setVolume(nextVolume);
      } catch (e) {
        console.error('Error ramping Spaces volume:', e);
      }

      if (progress >= 1) {
        clearVolumeRamp();
        applyPlayerVolume(player, targetVolume);
      }
    }, 16);
  }, [applyPlayerVolume, clearVolumeRamp]);

  const startPlayback = useCallback((player = playerRef.current, volumeHint) => {
    if (!player) return;
    const forced = typeof volumeHint === 'number';
    if (!forced && !shouldRunPlayer()) return;
    const vol = forced ? volumeHint : resolvePlaybackVolume();
    if (vol <= 0) return;
    playbackVolumeRef.current = vol;
    applyPlayerVolume(player, vol);
    try {
      if (typeof player.playVideo === 'function') {
        player.playVideo();
      }
    } catch (e) {
      console.error('Error starting playback:', e);
    }
  }, [applyPlayerVolume, resolvePlaybackVolume]);

  const shouldKeepVideoVisible = useCallback(() => {
    return (
      isOnFocusRoute &&
      shouldShowSpacesBackground(userIdRef.current, currentVideoIdRef.current)
    );
  }, [isOnFocusRoute]);

  const syncSpacesPlayback = useCallback(() => {
    if (!isSpacesPlaybackActive() || isSpacesPaused()) return;
    const vol = resolvePlaybackVolume();
    if (vol <= 0) return;
    playbackVolumeRef.current = vol;
    if (playerRef.current) {
      applyPlayerVolume(playerRef.current, vol);
      startPlayback(playerRef.current, vol);
      pendingSpacesPlaybackRef.current = false;
    } else {
      pendingSpacesPlaybackRef.current = true;
      setPlayerActivated(true);
      void loadYouTubeIframeApi();
    }
  }, [applyPlayerVolume, isSpacesPaused, isSpacesPlaybackActive, resolvePlaybackVolume, startPlayback]);

  const scheduleAudioSync = useCallback(
    (player = playerRef.current) => {
      if (!player) return;
      if (audioSyncTimeoutRef.current) {
        clearTimeout(audioSyncTimeoutRef.current);
        audioSyncTimeoutRef.current = null;
      }
      if (!isSpacesPlaybackActive() || isSpacesPaused()) return;

      let attempts = 0;
      const maxAttempts = 16;

      const tick = () => {
        audioSyncTimeoutRef.current = null;
        if (!playerRef.current || !isSpacesPlaybackActive() || isSpacesPaused()) return;

        const vol = resolvePlaybackVolume();
        if (vol > 0) {
          playbackVolumeRef.current = vol;
          applyPlayerVolume(playerRef.current, vol);
          try {
            if (typeof playerRef.current.unMute === 'function') playerRef.current.unMute();
            if (typeof playerRef.current.playVideo === 'function') playerRef.current.playVideo();
          } catch (e) {
            console.error('Error syncing Spaces audio:', e);
          }
        }

        attempts += 1;
        if (attempts < maxAttempts && vol > 0) {
          audioSyncTimeoutRef.current = setTimeout(tick, 200);
        }
      };

      tick();
    },
    [applyPlayerVolume, isSpacesPaused, isSpacesPlaybackActive, resolvePlaybackVolume]
  );

  const restoreAudioAfterVideoSwitch = useCallback(
    (player = playerRef.current) => {
      if (!player) return;
      if (isSpacesPaused()) {
        applyPlayerVolume(player, 0);
        return;
      }

      const baseVolume = volumeRef.current;
      const ducked = playbackVolumeRef.current;
      const effectiveVolume =
        ducked !== null && ducked !== undefined && ducked > 0 ? ducked : baseVolume;

      if (effectiveVolume <= 0) return;

      playbackVolumeRef.current = effectiveVolume;
      applyPlayerVolume(player, effectiveVolume);
      try {
        if (typeof player.unMute === 'function') player.unMute();
        if (typeof player.playVideo === 'function') player.playVideo();
      } catch (e) {
        console.error('Error restoring audio after video switch:', e);
      }
      scheduleAudioSync(player);
    },
    [applyPlayerVolume, isSpacesPaused, scheduleAudioSync]
  );

  applyPlayerVolumeRef.current = applyPlayerVolume;
  startPlaybackRef.current = startPlayback;
  restoreAudioAfterVideoSwitchRef.current = restoreAudioAfterVideoSwitch;

  const switchToVideo = useCallback((newVideoId) => {
    const resolvedId = newVideoId || DEFAULT_VIDEO_ID;
    if (resolvedId === currentVideoIdRef.current) return;

    currentVideoIdRef.current = resolvedId;
    setCurrentVideoId(resolvedId);
    setIsVideoPlaying(false);
    pendingVideoSwitchRef.current = true;

    if (playerRef.current?.loadVideoById) {
      try {
        playerRef.current.loadVideoById(resolvedId);
      } catch (e) {
        console.error('Error switching video:', e);
        pendingVideoSwitchRef.current = false;
      }
    } else {
      pendingVideoSwitchRef.current = false;
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('focus-spaces-resume'));
    }
  }, []);

  useEffect(() => {
    switchToVideo(resolveSpacesVideoId(backgroundVideoId));
  }, [backgroundVideoId, switchToVideo]);

  const savePlaybackPosition = (videoId, time) => {
    if (typeof window === 'undefined' || !videoId) return;
    try {
      setUserStorageItem(userIdRef.current, `focus-video-position-${videoId}`, time.toString());
    } catch (e) {
      console.error('Error saving playback position:', e);
    }
  };

  const destroyPlayer = () => {
    clearVolumeRamp();
    if (audioSyncTimeoutRef.current) {
      clearTimeout(audioSyncTimeoutRef.current);
      audioSyncTimeoutRef.current = null;
    }
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

  const attachPlayerApi = useCallback((videoId) => {
    if (!iframeRef.current || playerRef.current) return;
    if (!window.YT?.Player) return;

    try {
      playerRef.current = new window.YT.Player('youtube-background-player', {
        events: {
          onReady: (event) => {
            setPlayerReady(true);
            if (
              (playbackVolumeRef.current === null || playbackVolumeRef.current === undefined) &&
              isSpacesPlaybackActive() &&
              !isSpacesPaused()
            ) {
              playbackVolumeRef.current = volumeRef.current;
            }
            const targetId = currentVideoIdRef.current;
            if (targetId && targetId !== videoId && typeof event.target.loadVideoById === 'function') {
              try {
                pendingVideoSwitchRef.current = true;
                event.target.loadVideoById(targetId);
              } catch (e) {
                console.error('Error loading target video on ready:', e);
                pendingVideoSwitchRef.current = false;
              }
            }
            startPlaybackRef.current?.(event.target);
            scheduleAudioSync(event.target);
            if (pendingSpacesPlaybackRef.current || isSpacesPlaybackActive()) {
              pendingSpacesPlaybackRef.current = false;
              restoreAudioAfterVideoSwitchRef.current?.(event.target);
            }
            window.dispatchEvent(new CustomEvent('focus-spaces-player-ready'));
            if (playbackPositionIntervalRef.current) {
              clearInterval(playbackPositionIntervalRef.current);
            }
            playbackPositionIntervalRef.current = setInterval(() => {
              try {
                if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
                  const currentTime = playerRef.current.getCurrentTime();
                  const activeVideoId = currentVideoIdRef.current;
                  if (currentTime && currentTime > 0 && activeVideoId) {
                    savePlaybackPosition(activeVideoId, currentTime);
                  }
                }
              } catch (e) {}
            }, 5000);
          },
          onStateChange: (event) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsVideoPlaying(true);
              if (pendingVideoSwitchRef.current) {
                pendingVideoSwitchRef.current = false;
                restoreAudioAfterVideoSwitchRef.current?.(event.target);
              } else {
                applyPlayerVolumeRef.current?.(event.target);
                scheduleAudioSync(event.target);
              }
            } else if (
              event.data === window.YT.PlayerState.BUFFERING ||
              event.data === window.YT.PlayerState.PAUSED ||
              event.data === window.YT.PlayerState.CUED
            ) {
              setIsVideoPlaying(false);
              const resumeAudio =
                isSpacesPlaybackActive() && !isSpacesPaused();
              const resumeVisual = shouldKeepVideoVisible();
              if (
                shouldRunPlayer() &&
                (resumeAudio || resumeVisual) &&
                (event.data === window.YT.PlayerState.PAUSED ||
                  event.data === window.YT.PlayerState.CUED)
              ) {
                setTimeout(() => {
                  if (pendingVideoSwitchRef.current) {
                    restoreAudioAfterVideoSwitchRef.current?.(event.target);
                  } else {
                    startPlaybackRef.current?.(event.target);
                  }
                }, 150);
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
  }, [isSpacesPaused, isSpacesPlaybackActive, scheduleAudioSync, shouldKeepVideoVisible]);

  attachPlayerApiRef.current = attachPlayerApi;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const videoId = resolveSpacesVideoId(backgroundVideoId);
    const showOnFocus = isOnFocusRoute && shouldShowSpacesBackground(userId, videoId);
    const audioIntent = userId ? isSpacesPlaybackIntent(userId) : false;
    const hasSpaces = userId ? hasSpacesMediaConfigured(userId) : false;

    if (showOnFocus || audioIntent || hasSpaces) {
      setPlayerActivated(true);
      void loadYouTubeIframeApi();
    }
  }, [userId, isOnFocusRoute, backgroundVideoId]);

  useEffect(() => {
    if (!playerActivated) return undefined;
    loadYouTubeIframeApi().then(() => {
      attachPlayerApiRef.current?.(currentVideoIdRef.current);
    });
    return () => destroyPlayer();
  }, [playerActivated]);

  useEffect(() => {
    const handleVideoChange = (e) => {
      switchToVideo(resolveSpacesVideoId(e.detail?.videoId));
    };
    window.addEventListener('focus-video-changed', handleVideoChange);
    return () => window.removeEventListener('focus-video-changed', handleVideoChange);
  }, [switchToVideo]);

  useEffect(() => {
    if (!playerReady || !playerRef.current || !shouldKeepVideoVisible()) return;
    startPlayback(playerRef.current);
  }, [playerReady, shouldKeepVideoVisible, startPlayback, isOnFocusRoute, backgroundVideoId]);

  useEffect(() => {
    if (!playerActivated || !isSpacesPlaybackActive()) return;
    syncSpacesPlayback();
  }, [playerActivated, volume, userId, syncSpacesPlayback, isSpacesPlaybackActive]);

  useEffect(() => {
    if (!playerReady || !playerRef.current || !isSpacesPlaybackActive()) return;
    syncSpacesPlayback();
  }, [playerReady, userId, syncSpacesPlayback, isSpacesPlaybackActive]);

  useEffect(() => {
    const handleVolumeChange = (e) => {
      if (e.detail?.playbackOnly) {
        if (e.detail?.volume !== undefined) {
          if (e.detail.baseVolume !== undefined) {
            spacesBaseVolumeRef.current = e.detail.baseVolume;
          }
          const forceLevel = Boolean(e.detail.forceLevel) || e.detail.baseVolume === 0;
          if (e.detail.volume === 0 && !isSpacesPaused() && !forceLevel) {
            return;
          }
          if (e.detail.volume > 0) {
            setPlayerActivated(true);
          }
          playbackVolumeRef.current = e.detail.volume;
          if (pendingVideoSwitchRef.current) {
            return;
          }
          if (!playerRef.current) {
            pendingSpacesPlaybackRef.current = true;
            setPlayerActivated(true);
            void loadYouTubeIframeApi();
            return;
          }
          const rampMs = e.detail.rampMs || 0;
          if (rampMs > 0 && e.detail.volume > 0 && playerRef.current) {
            rampPlayerVolume(playerRef.current, e.detail.volume, rampMs);
          } else if (e.detail.volume > 0 && playerRef.current) {
            playbackVolumeRef.current = e.detail.volume;
            applyPlayerVolume(playerRef.current, e.detail.volume);
            try {
              if (typeof playerRef.current.unMute === 'function') {
                playerRef.current.unMute();
              }
              if (typeof playerRef.current.playVideo === 'function') {
                playerRef.current.playVideo();
              }
            } catch (err) {
              console.error('Error starting Spaces playback:', err);
            }
          } else if (e.detail.volume === 0 && playerRef.current) {
            clearVolumeRamp();
            applyPlayerVolume(playerRef.current, 0);
          }
        }
        return;
      }
      if (e.detail?.volume !== undefined) {
        spacesBaseVolumeRef.current = e.detail.volume;
      }
    };
    window.addEventListener('focus-volume-changed', handleVolumeChange);
    return () => window.removeEventListener('focus-volume-changed', handleVolumeChange);
  }, [applyPlayerVolume, startPlayback, isSpacesPaused, rampPlayerVolume, clearVolumeRamp]);

  useEffect(() => {
    const resume = () => {
      if (pendingVideoSwitchRef.current && playerRef.current) return;
      syncSpacesPlayback();
    };
    window.addEventListener('focus-spaces-activate', resume);
    window.addEventListener('focus-spaces-resume', resume);
    return () => {
      window.removeEventListener('focus-spaces-activate', resume);
      window.removeEventListener('focus-spaces-resume', resume);
    };
  }, [syncSpacesPlayback]);

  useEffect(() => {
    const handlePauseChanged = (e) => {
      if (e?.detail?.isPlaying === false) {
        playbackVolumeRef.current = 0;
        if (playerRef.current) {
          applyPlayerVolume(playerRef.current, 0);
        }
        return;
      }

      if (shouldKeepVideoVisible()) {
        setPlayerActivated(true);
        if (!playerRef.current) {
          pendingSpacesPlaybackRef.current = true;
          void loadYouTubeIframeApi();
          return;
        }

        if (isSpacesPaused()) {
          applyPlayerVolume(playerRef.current, 0);
        } else if (isSpacesPlaybackActive()) {
          syncSpacesPlayback();
          scheduleAudioSync(playerRef.current);
        } else {
          applyPlayerVolume(playerRef.current, 0);
          if (typeof playerRef.current.playVideo === 'function') {
            playerRef.current.playVideo();
          }
        }
        return;
      }

      if (!isSpacesPlaybackActive() || isSpacesPaused()) {
        if (playerRef.current) {
          applyPlayerVolume(playerRef.current, 0);
        }
      } else {
        setPlayerActivated(true);
        void loadYouTubeIframeApi();
        if (playerRef.current) {
          syncSpacesPlayback();
          scheduleAudioSync(playerRef.current);
        } else {
          pendingSpacesPlaybackRef.current = true;
        }
      }
    };
    window.addEventListener('soundscape-state-changed', handlePauseChanged);
    window.addEventListener('soundscape-play-pause-changed', handlePauseChanged);
    return () => {
      window.removeEventListener('soundscape-state-changed', handlePauseChanged);
      window.removeEventListener('soundscape-play-pause-changed', handlePauseChanged);
    };
  }, [applyPlayerVolume, isSpacesPaused, isSpacesPlaybackActive, shouldKeepVideoVisible, syncSpacesPlayback, scheduleAudioSync]);

  useEffect(() => {
    const handleStopAll = () => {
      pendingSpacesPlaybackRef.current = false;
      playbackVolumeRef.current = 0;
      if (playerRef.current) {
        applyPlayerVolume(playerRef.current, 0);
      }
    };
    window.addEventListener('soundscape-stop-all', handleStopAll);
    return () => window.removeEventListener('soundscape-stop-all', handleStopAll);
  }, [applyPlayerVolume]);

  useEffect(() => {
    if (!userId) {
      pendingSpacesPlaybackRef.current = false;
      playbackVolumeRef.current = 0;
    }
  }, [userId]);

  useEffect(() => {
    if (!playerReady) return;
    const unlockAudio = () => {
      if (!isSpacesPlaybackActive() || isSpacesPaused()) return;
      playbackVolumeRef.current = volumeRef.current;
      syncSpacesPlayback();
      scheduleAudioSync(playerRef.current);
    };
    window.addEventListener('pointerdown', unlockAudio, { once: true, capture: true });
    window.addEventListener('keydown', unlockAudio, { once: true, capture: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudio, { capture: true });
      window.removeEventListener('keydown', unlockAudio, { capture: true });
    };
  }, [playerReady, syncSpacesPlayback, isSpacesPaused, isSpacesPlaybackActive, scheduleAudioSync]);

  const handleIframeLoad = () => {
    setIsVideoPlaying(true);
    loadYouTubeIframeApi().then(() => attachPlayerApiRef.current?.(currentVideoIdRef.current));
  };

  const showLoadingOverlay = isOnFocusRoute && (!playerReady || !isVideoPlaying);

  if (!playerActivated) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[1] overflow-hidden bg-black"
      style={{
        pointerEvents: isOnFocusRoute ? 'auto' : 'none',
        visibility: isOnFocusRoute ? 'visible' : 'hidden',
      }}
      aria-hidden={!isOnFocusRoute}
    >
        <div
          ref={shellRef}
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
            ref={iframeRef}
            id="youtube-background-player"
            src={embedSrcRef.current}
            allow={YOUTUBE_IFRAME_ALLOW}
            referrerPolicy={YOUTUBE_IFRAME_REFERRER_POLICY}
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
