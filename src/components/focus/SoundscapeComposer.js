'use client';

import { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { useUser, useAuth } from '@clerk/nextjs';
import { FocusContext } from '@/contexts/FocusContext';
import {
  SOUNDSCAPE_SOUND_FILES,
  SOUNDSCAPE_LIBRARY,
  DEFAULT_SOUNDSCAPE_RECIPES,
  getSoundscapeSoundName,
  getSoundscapeSoundIcon,
  normalizeActiveSound,
  enforceSingleInstanceCategories,
} from '@/lib/soundscapeConstants';
import { bootstrapSpacesAudioIfEmpty as runBootstrapSpacesAudio } from '@/lib/soundscapeBootstrap';
import { resumeSoundscapeFromUserGesture } from '@/lib/soundscapeGesturePlay';
import {
  getOrCreateSoundscapeAudio,
  getSoundscapeAudio,
  playSoundscapeMixImmediate,
  removeSoundscapeAudio,
  soundscapeSoundTimestamps,
  stopAllSoundscapeAudioElements,
  warmSoundscapeMix,
} from '@/lib/soundscapeAudioEngine';
import {
  getSupabaseClient,
  getUserStorageItem,
  getUserStorageJson,
  setUserStorageItem,
  setUserStorageJson,
  setSupabaseAuthToken,
  getFocusTimerRecipesFromSupabase,
  setFocusTimerRecipesToSupabase,
} from '@/utils/userStorage';
import { DEFAULT_SPACES_VIDEO_ID, resolveSpacesVideoId } from '@/lib/spacesConstants';
import {
  applySpacesBaseVolume,
  dispatchFocusSpacesPauseChanged,
  getSpacesPreviousVolume as getStoredSpacesPreviousVolume,
  resolveSpacesPlaybackVolume,
  saveSpacesPreviousVolume as persistSpacesPreviousVolume,
  toggleSpacesMute,
} from '@/lib/spacesVolumeControl';
import { getClerkSupabaseToken } from '@/lib/clerkSupabaseToken';
import WorkspaceIntegrations from '@/components/workspace/WorkspaceIntegrations';

/** Quick fade-in on play/resume — audible immediately, no hard pop. */
const PLAYBACK_FADE_MS = 280;
/** Per-layer slider ramp — smooth enough to feel continuous while dragging. */
const VOLUME_RAMP_MS = 150;

function mapSoundscapeRecipeRow(row) {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    sounds: row.sounds || [],
    globalVolume: row.global_volume ?? 75,
    timestamp: new Date(row.updated_at || row.created_at).getTime(),
    isCustom: true,
  };
}

function isLocalSoundscapeRecipeId(id) {
  return typeof id === 'string' && id.startsWith('custom-recipe-');
}

export default function SoundscapeComposer({
  isOpen,
  onClose,
  initialPanel = 'composer',
  integrationsOAuth = null,
  onIntegrationsOAuthConsumed,
}) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const userId = user?.id || null;
  const pathname = usePathname();
  const focusContext = useContext(FocusContext);
  const getItem = (key) => getUserStorageItem(userId, key, key);
  const getJson = (key) => getUserStorageJson(userId, key, key);
  const setItem = (key, value) => setUserStorageItem(userId, key, value);
  const setJson = (key, value) => setUserStorageJson(userId, key, value);
  const getSupabase = () => getSupabaseClient();

  const getSessionActive = () => {
    if (typeof window === 'undefined') return false;
    const saved = getItem('soundscape-session-active');
    return saved === 'true';
  };

  const setSessionActive = (value) => {
    if (typeof window === 'undefined') return;
    setItem('soundscape-session-active', value ? 'true' : 'false');
  };
  
  // Get values from context or localStorage
  const getBackgroundVideoId = () => {
    if (focusContext?.backgroundVideoId !== undefined) {
      return resolveSpacesVideoId(focusContext.backgroundVideoId);
    }
    if (typeof window !== 'undefined') {
      return resolveSpacesVideoId(getItem('focus-background-video-id'));
    }
    return DEFAULT_SPACES_VIDEO_ID;
  };

  const getSpacesVolume = () => {
    if (focusContext?.volume !== undefined) {
      return focusContext.volume;
    }
    if (typeof window !== 'undefined') {
      const saved = getItem('focus-video-volume');
      const parsed = saved ? parseInt(saved, 10) : 50;
      return Number.isNaN(parsed) ? 50 : Math.max(0, Math.min(100, parsed));
    }
    return 50;
  };

  const isUpdatingFromComposerRef = useRef(false);
  const lastPlaybackVolumeRef = useRef(null);
  const prevPathnameRef = useRef(null);

  const isSpacesPausedByUser = () => {
    if (typeof window === 'undefined') return false;
    return getItem('focus-spaces-paused') === 'true';
  };

  const isSpacesPlaybackActive = () => {
    if (typeof window === 'undefined') return false;
    return getItem('focus-spaces-paused') === 'false';
  };

  const getEffectiveSpacesVolume = (baseVolume) => {
    return resolveSpacesPlaybackVolume(userId, baseVolume, { soloSoundId });
  };

  const getSpacesPreviousVolume = () => {
    const fromRef = previousSpacesVolumeRef.current;
    if (fromRef > 0) return fromRef;
    return getStoredSpacesPreviousVolume(userId);
  };

  const saveSpacesPreviousVolume = (vol) => {
    if (vol <= 0) return;
    previousSpacesVolumeRef.current = vol;
    persistSpacesPreviousVolume(userId, vol);
  };

  /** Persist the user's Spaces volume preference (base level). */
  const persistSpacesVolume = (val) => {
    const newVolume = Math.max(0, Math.min(100, val));
    if (focusContext?.volume === newVolume) {
      return;
    }
    if (focusContext?.setVolume) {
      focusContext.setVolume(newVolume);
    }
    if (typeof window !== 'undefined') {
      setItem('focus-video-volume', newVolume.toString());
      isUpdatingFromComposerRef.current = true;
      window.dispatchEvent(
        new CustomEvent('focus-volume-changed', { detail: { volume: newVolume } })
      );
      setTimeout(() => {
        isUpdatingFromComposerRef.current = false;
      }, 0);
    }
  };

  /** Update YouTube playback level (ducking or explicit Spaces level from composer). */
  const dispatchSpacesPlaybackVolume = (baseVolume, { forceLevel = false, rampMs = 0 } = {}) => {
    if (typeof window === 'undefined') return;
    const playbackVolume = getEffectiveSpacesVolume(baseVolume);
    window.dispatchEvent(
      new CustomEvent('focus-volume-changed', {
        detail: {
          volume: playbackVolume,
          playbackOnly: true,
          baseVolume,
          forceLevel,
          rampMs,
        },
      })
    );
  };

  const loadPersistedActiveSounds = () => {
    if (typeof window === 'undefined') return [];
    const saved = getJson('soundscape-active-sounds');
    if (!Array.isArray(saved)) return [];
    return enforceSingleInstanceCategories(
      saved.map((sound) => normalizeActiveSound(sound)).filter(Boolean)
    );
  };

  const [activeTab, setActiveTab] = useState('Atmosphere');
  const [spacesVolume, setSpacesVolumeState] = useState(() => getSpacesVolume());
  const [spacesMuted, setSpacesMuted] = useState(false);
  const [globalVolume, setGlobalVolume] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = getItem('soundscape-global-volume');
      return saved ? parseInt(saved, 10) : 75;
    }
    return 75;
  });
  const [activeSounds, setActiveSounds] = useState(() => loadPersistedActiveSounds());
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSyncKey, setAudioSyncKey] = useState(0);
  const [soloSoundId, setSoloSoundId] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeType, setRecipeType] = useState('bolt');
  const [customRecipes, setCustomRecipes] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recipeToDelete, setRecipeToDelete] = useState(null);

  // Settings modal panel: 'composer' | 'focusflow' | 'integrations'
  const [settingsPanel, setSettingsPanel] = useState(initialPanel);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
    setSettingsPanel(initialPanel);
    setSpacesMuted(getItem('focus-spaces-paused') !== 'false');
    // Restore a saved session when opening — never force isPlaying false here,
    // which was pausing layers while the modal stayed open.
    const sessionActive = getItem('soundscape-session-active') === 'true';
    const savedPlaying = getItem('soundscape-is-playing') === 'true';
    if (sessionActive && savedPlaying) {
      hasStartedPlaybackRef.current = true;
      setIsPlaying(true);
    }
  }, [isOpen, initialPanel, userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncPlaybackUi = (e) => {
      if (volumeSliderActiveRef.current) return;
      if (e?.detail?.isPlaying !== undefined) {
        setIsPlaying(e.detail.isPlaying);
      }
      setSpacesMuted(getItem('focus-spaces-paused') !== 'false');
    };
    window.addEventListener('soundscape-play-pause-changed', syncPlaybackUi);
    return () => window.removeEventListener('soundscape-play-pause-changed', syncPlaybackUi);
  }, [userId]);
  // Focus Flow settings (persisted via getItem/setItem after mount)
  const [timerMode, setTimerMode] = useState('pomodoro');
  const [sessionMinutes, setSessionMinutes] = useState(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [countdownMinutes, setCountdownMinutes] = useState(5);
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);
  const [alarmVolume, setAlarmVolume] = useState(60);
  const [tickSound, setTickSound] = useState(true);
  const [customTimerRecipes, setCustomTimerRecipes] = useState([]);
  /** 'sound' = Save Recipe modal saves soundscape mix; 'timer' = same modal saves Focus Flow timer preset */
  const [saveRecipeModalKind, setSaveRecipeModalKind] = useState('sound');

  // Local string state for duration inputs so users can type freely (e.g. clear and type "30") without value jumping
  const [durationInputStr, setDurationInputStr] = useState({
    session: '',
    shortBreak: '',
    longBreak: '',
    countdown: '',
  });

  const defaultTimerRecipes = [
    {
      id: 'timer-recipe-animedoro',
      name: 'Animedoro',
      icon: 'pen',
      timerMode: 'pomodoro',
      sessionMinutes: 50,
      shortBreakMinutes: 10,
      longBreakMinutes: 20,
      countdownMinutes: 5,
      autoStartBreaks: true,
      alarmVolume: 60,
      tickSound: true,
      isCustom: false,
    },
    {
      id: 'timer-recipe-52-17',
      name: '52/17',
      icon: 'code',
      timerMode: 'pomodoro',
      sessionMinutes: 52,
      shortBreakMinutes: 17,
      longBreakMinutes: 25,
      countdownMinutes: 5,
      autoStartBreaks: true,
      alarmVolume: 60,
      tickSound: true,
      isCustom: false,
    },
  ];

  const timerRecipes = [...defaultTimerRecipes, ...customTimerRecipes];

  const normalizeTimerRecipe = (recipe) => {
    if (!recipe || typeof recipe !== 'object') return null;
    const mode = recipe.timerMode === 'stopwatch' || recipe.timerMode === 'countdown' ? recipe.timerMode : 'pomodoro';
    const session = Number.parseInt(recipe.sessionMinutes, 10);
    const shortBreak = Number.parseInt(recipe.shortBreakMinutes, 10);
    const longBreak = Number.parseInt(recipe.longBreakMinutes, 10);
    const countdown = Number.parseInt(recipe.countdownMinutes, 10);
    const alarm = Number.parseInt(recipe.alarmVolume, 10);
    const safeName = typeof recipe.name === 'string' ? recipe.name.trim() : '';
    if (!safeName) return null;

    const allowedIcons = ['bolt', 'code', 'pen', 'lotus', 'briefcase'];
    const icon = allowedIcons.includes(recipe.icon) ? recipe.icon : 'bolt';

    return {
      id: recipe.id || `timer-recipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: safeName,
      icon,
      timerMode: mode,
      sessionMinutes: Number.isNaN(session) ? 25 : Math.max(1, Math.min(120, session)),
      shortBreakMinutes: Number.isNaN(shortBreak) ? 5 : Math.max(1, Math.min(60, shortBreak)),
      longBreakMinutes: Number.isNaN(longBreak) ? 15 : Math.max(1, Math.min(60, longBreak)),
      countdownMinutes: Number.isNaN(countdown) ? 5 : Math.max(1, Math.min(120, countdown)),
      autoStartBreaks: recipe.autoStartBreaks !== false,
      alarmVolume: Number.isNaN(alarm) ? 60 : Math.max(0, Math.min(100, alarm)),
      tickSound: recipe.tickSound !== false,
      isCustom: recipe.isCustom !== false,
      createdAt: recipe.createdAt || new Date().toISOString(),
    };
  };
  
  // Hydrate Focus Flow settings from storage when modal opens or userId is ready
  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;
    const mode = getItem('focus-settings-timer-mode');
    if (mode === 'stopwatch' || mode === 'countdown') setTimerMode(mode);
    const s = getItem('focus-settings-session-minutes');
    if (s) { const n = parseInt(s, 10); if (!Number.isNaN(n)) setSessionMinutes(Math.max(1, Math.min(120, n))); }
    const sb = getItem('focus-settings-short-break-minutes');
    if (sb) { const n = parseInt(sb, 10); if (!Number.isNaN(n)) setShortBreakMinutes(Math.max(1, Math.min(60, n))); }
    const lb = getItem('focus-settings-long-break-minutes');
    if (lb) { const n = parseInt(lb, 10); if (!Number.isNaN(n)) setLongBreakMinutes(Math.max(1, Math.min(60, n))); }
    const cd = getItem('focus-settings-countdown-minutes');
    if (cd) { const n = parseInt(cd, 10); if (!Number.isNaN(n)) setCountdownMinutes(Math.max(1, Math.min(120, n))); }
    const asb = getItem('focus-settings-auto-start-breaks');
    if (asb !== null && asb !== undefined) setAutoStartBreaks(asb === 'true');
    const av = getItem('focus-settings-alarm-volume');
    if (av) { const n = parseInt(av, 10); if (!Number.isNaN(n)) setAlarmVolume(Math.max(0, Math.min(100, n))); }
    const ts = getItem('focus-settings-tick-sound');
    if (ts !== null && ts !== undefined) setTickSound(ts === 'true');
  }, [userId, isOpen]);

  // Sync duration input strings when opening modal or switching to Focus Flow panel (so displayed values match numbers)
  useEffect(() => {
    if (isOpen && settingsPanel === 'focusflow') {
      setDurationInputStr({
        session: String(sessionMinutes),
        shortBreak: String(shortBreakMinutes),
        longBreak: String(longBreakMinutes),
        countdown: String(countdownMinutes),
      });
    }
  }, [isOpen, settingsPanel, sessionMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    const loadTimerRecipes = async () => {
      const remoteRecipes = await getFocusTimerRecipesFromSupabase(userId);
      if (cancelled) return;
      const normalizedRemote = Array.isArray(remoteRecipes)
        ? remoteRecipes.map(normalizeTimerRecipe).filter(Boolean)
        : [];
      if (normalizedRemote.length > 0) {
        setCustomTimerRecipes(normalizedRemote);
        setJson('focus-timer-custom-recipes', normalizedRemote);
        return;
      }
      const cached = getJson('focus-timer-custom-recipes');
      if (Array.isArray(cached)) {
        setCustomTimerRecipes(cached.map(normalizeTimerRecipe).filter(Boolean));
      }
    };

    loadTimerRecipes();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const audioRefs = useRef({});
  const initializedRef = useRef(false);
  const previousVolumesRef = useRef({}); // Store previous volumes when muting individual sounds
  const previousGlobalVolumeRef = useRef(75); // Store previous global volume when muting master
  const previousSpacesVolumeRef = useRef(50); // Store previous Spaces volume when muting
  /** True when master mute auto-paused Spaces (restore on master unmute). */
  const masterMutedSpacesRef = useRef(false);
  const soundTimestampsRef = useRef({}); // Track when each sound was added to determine oldest
  const hasStartedPlaybackRef = useRef(false);
  /** Skip remote/local hydration overwriting an in-session mix the user is editing. */
  const localMixEditedRef = useRef(false);
  const stateHydratedRef = useRef(false);
  const saveStateTimeoutRef = useRef(null);
  const activeSoundsRef = useRef(activeSounds);
  const globalVolumeRef = useRef(globalVolume);
  const soloSoundIdRef = useRef(soloSoundId);
  const fadeIntervalsRef = useRef({});
  const fadingSoundIdsRef = useRef(new Set());
  /** While a volume slider is held, block pause handlers and volume sync effects. */
  const volumeSliderActiveRef = useRef(null);
  const isPlayingRef = useRef(false);

  activeSoundsRef.current = activeSounds;
  globalVolumeRef.current = globalVolume;
  soloSoundIdRef.current = soloSoundId;
  isPlayingRef.current = isPlaying;

  const bootstrapSpacesAudioIfEmpty = () =>
    runBootstrapSpacesAudio({
      getActiveSoundCount: () => activeSoundsRef.current.length,
      getSpacesVolume: getSpacesVolume,
      globalVolume: globalVolumeRef.current,
      hasStartedPlaybackRef,
      initializedRef,
      setSessionActive,
    });

  const muteSpacesForMaster = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!getBackgroundVideoId() || getSpacesVolume() <= 0) return;
    if (isSpacesPausedByUser()) return;
    masterMutedSpacesRef.current = true;
    setSpacesMuted(true);
    setItem('focus-spaces-paused', 'true');
    lastPlaybackVolumeRef.current = null;
    dispatchSpacesPlaybackVolume(0, { forceLevel: true });
    dispatchFocusSpacesPauseChanged(true);
  }, [userId]);

  const restoreSpacesAfterMaster = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!masterMutedSpacesRef.current) return;
    masterMutedSpacesRef.current = false;
    if (!getBackgroundVideoId() || getSpacesVolume() <= 0) return;
    setSpacesMuted(false);
    setItem('focus-spaces-paused', 'false');
    lastPlaybackVolumeRef.current = null;
    window.dispatchEvent(new CustomEvent('focus-spaces-activate'));
    dispatchSpacesPlaybackVolume(getSpacesVolume(), { forceLevel: true });
    dispatchFocusSpacesPauseChanged(false);
  }, [userId, spacesVolume]);

  const pauseSoundscapePlayback = useCallback((dispatchEvent = true) => {
    if (typeof window === 'undefined') return;
    if (volumeSliderActiveRef.current) return;
    hasStartedPlaybackRef.current = false;
    setSessionActive(false);
    setIsPlaying(false);
    setItem('soundscape-is-playing', 'false');
    setItem('soundscape-session-active', 'false');
    lastPlaybackVolumeRef.current = 0;
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio) audio.pause();
    });
    if (dispatchEvent) {
      window.dispatchEvent(
        new CustomEvent('soundscape-play-pause-changed', { detail: { isPlaying: false } })
      );
    }
  }, [userId]);

  const resumeSoundscapePlayback = useCallback(() => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
      new CustomEvent('soundscape-play-pause-changed', {
        detail: { isPlaying: true, bootstrapSpaces: true },
      })
    );
  }, []);

  const bootstrapSpacesPlayback = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (!getBackgroundVideoId()) return;
    const vol = getSpacesVolume();
    if (vol <= 0) return;
    if (isSpacesPausedByUser()) return;

    setItem('focus-spaces-paused', 'false');
    setSpacesMuted(false);
    lastPlaybackVolumeRef.current = null;
    window.dispatchEvent(new CustomEvent('focus-spaces-activate'));
    dispatchSpacesPlaybackVolume(vol);
    window.dispatchEvent(new CustomEvent('soundscape-state-changed'));
  }, [userId, spacesVolume, globalVolume, isPlaying, soloSoundId]);

  const isMixAudible = useCallback((
    sounds,
    masterVol,
    spacesVol,
  ) => {
    if (masterVol > 0 && Array.isArray(sounds) && sounds.some((s) => s.volume > 0)) {
      return true;
    }
    if (spacesVol > 0 && getBackgroundVideoId()) {
      return true;
    }
    return false;
  }, []);

  const pauseIfMixInaudible = useCallback((
    soundsSnapshot = activeSoundsRef.current,
    masterVol = globalVolumeRef.current,
    spacesVol,
  ) => {
    const spacesVolEffective = spacesVol ?? getSpacesVolume();
    if (!isMixAudible(soundsSnapshot, masterVol, spacesVolEffective)) {
      pauseSoundscapePlayback();
    }
  }, [isMixAudible, pauseSoundscapePlayback, userId]);

  const resumeMixIfAudible = useCallback((
    soundsSnapshot,
    masterVol,
    spacesVol,
    { restartAudio = true } = {},
  ) => {
    const spacesVolEffective = spacesVol ?? getSpacesVolume();
    if (!isMixAudible(soundsSnapshot, masterVol, spacesVolEffective)) {
      return false;
    }
    if (isPlaying) return true;

    activeSoundsRef.current = soundsSnapshot;
    globalVolumeRef.current = masterVol;
    hasStartedPlaybackRef.current = true;
    setSessionActive(true);
    setIsPlaying(true);
    setItem('soundscape-is-playing', 'true');
    setItem('soundscape-session-active', 'true');

    if (restartAudio) {
      window.dispatchEvent(
        new CustomEvent('soundscape-play-pause-changed', {
          detail: { isPlaying: true, immediate: true },
        })
      );
    } else {
      window.dispatchEvent(
        new CustomEvent('soundscape-play-pause-changed', {
          detail: { isPlaying: true, syncOnly: true },
        })
      );
      if (
        !isSpacesPausedByUser() &&
        getBackgroundVideoId() &&
        spacesVolEffective > 0
      ) {
        window.dispatchEvent(new CustomEvent('focus-spaces-activate'));
        dispatchSpacesPlaybackVolume(spacesVolEffective);
      }
    }
    return true;
  }, [isMixAudible, isPlaying, userId]);

  const restorePersistedPlayback = useCallback(async () => {
    if (typeof window === 'undefined') return;

    const sessionActive = getItem('soundscape-session-active') === 'true';
    const savedPlaying = getItem('soundscape-is-playing') === 'true';

    if (!sessionActive || !savedPlaying) {
      const nowActive = getItem('soundscape-session-active') === 'true';
      const nowPlaying = getItem('soundscape-is-playing') === 'true';
      if (!(nowActive && nowPlaying)) {
        if (savedPlaying && !sessionActive) {
          setItem('soundscape-is-playing', 'false');
        }
      }
      return;
    }

    hasStartedPlaybackRef.current = true;
    setSessionActive(true);
    setIsPlaying(true);

    if (activeSoundsRef.current.length === 0) {
      bootstrapSpacesAudioIfEmpty();
    }

    let anyAudioStarted = activeSoundsRef.current.length === 0;
    for (const sound of activeSoundsRef.current) {
      const src = SOUNDSCAPE_SOUND_FILES[sound.id];
      if (!src) continue;
      if (!audioRefs.current[sound.id]) {
        const { audio } = getOrCreateSoundscapeAudio(sound.id, src);
        audioRefs.current[sound.id] = audio;
        audio.volume = (sound.volume / 100) * (globalVolumeRef.current / 100);
      }
      const audio = audioRefs.current[sound.id];
      if (!audio) continue;
      try {
        if (audio.paused) await audio.play();
        anyAudioStarted = true;
      } catch {
        // Browser blocked autoplay until user gesture
      }
    }

    if (!isSpacesPausedByUser() && getBackgroundVideoId() && getSpacesVolume() > 0) {
      window.dispatchEvent(new CustomEvent('focus-spaces-activate'));
      lastPlaybackVolumeRef.current = null;
      anyAudioStarted = true;
    }

    if (activeSoundsRef.current.length > 0 && !anyAudioStarted) {
      // Autoplay blocked until user gesture — keep mix ready, don't force pause
      return;
    }

    window.dispatchEvent(
      new CustomEvent('soundscape-play-pause-changed', { detail: { isPlaying: true, syncOnly: true } })
    );
    setAudioSyncKey((k) => k + 1);
  }, [pauseSoundscapePlayback, userId]);

  /** User added / chose sounds — mark an active session and play without unmuting Spaces. */
  const ensureSoundscapeSessionPlaying = () => {
    if (typeof window === 'undefined') return;
    setSessionActive(true);
    setItem('soundscape-is-playing', 'true');
    setItem('soundscape-session-active', 'true');
    hasStartedPlaybackRef.current = true;
    setIsPlaying(true);

    if (!isSpacesPausedByUser() && getBackgroundVideoId() && getSpacesVolume() > 0) {
      setItem('focus-spaces-paused', 'false');
      setSpacesMuted(false);
      window.dispatchEvent(new CustomEvent('focus-spaces-activate'));
      lastPlaybackVolumeRef.current = null;
      dispatchSpacesPlaybackVolume(getSpacesVolume());
    }

    window.dispatchEvent(new CustomEvent('soundscape-play-pause-changed', {
      detail: { isPlaying: true, syncOnly: true },
    }));
    window.dispatchEvent(new CustomEvent('soundscape-state-changed'));
  };

  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;
    const savedGlobalVolume = getItem('soundscape-global-volume');
    if (savedGlobalVolume) setGlobalVolume(parseInt(savedGlobalVolume, 10) || 75);
    const persisted = loadPersistedActiveSounds();
    if (!localMixEditedRef.current && persisted.length > 0) {
      setActiveSounds(persisted);
    }
    void restorePersistedPlayback();
  }, [userId, restorePersistedPlayback]);

  // Sound Library - only include sounds that exist in public/sounds
  const soundLibrary = SOUNDSCAPE_LIBRARY;

  const getSoundNameById = (soundId) => getSoundscapeSoundName(soundId);

  const defaultRecipes = DEFAULT_SOUNDSCAPE_RECIPES;

  // Load custom recipes: hydrate from cache first, then sync from Supabase when token is ready
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;
    let cancelled = false;

    const loadRecipes = async () => {
      const cached = getJson('soundscape-custom-recipes');
      const cachedRecipes = Array.isArray(cached) ? cached : [];
      if (cachedRecipes.length > 0 && !cancelled) {
        setCustomRecipes(cachedRecipes);
      }

      try {
        const token = await getClerkSupabaseToken(getToken, Boolean(userId));
        if (token) setSupabaseAuthToken(token);
      } catch (_) {
        // keep cached recipes
      }

      const supabase = getSupabase();
      if (!supabase || cancelled) return;

      const { data, error } = await supabase
        .from('soundscape_recipes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('soundscape_recipes load failed', error);
        }
        return;
      }

      const remoteRecipes = (data || []).map(mapSoundscapeRecipeRow);

      if (remoteRecipes.length > 0) {
        setCustomRecipes(remoteRecipes);
        setJson('soundscape-custom-recipes', remoteRecipes);
        return;
      }

      // Cloud empty but we have local-only saves — keep cache and try uploading them
      const localOnly = cachedRecipes.filter((r) => isLocalSoundscapeRecipeId(r.id));
      if (localOnly.length === 0) {
        if (cachedRecipes.length > 0) {
          setCustomRecipes(cachedRecipes);
        }
        return;
      }

      const synced = [];
      for (const recipe of cachedRecipes) {
        if (!isLocalSoundscapeRecipeId(recipe.id)) {
          synced.push(recipe);
          continue;
        }
        const { data: inserted, error: insertError } = await supabase
          .from('soundscape_recipes')
          .insert({
            user_id: userId,
            name: recipe.name,
            icon: recipe.icon,
            sounds: recipe.sounds,
            global_volume: recipe.globalVolume ?? 75,
            updated_at: new Date().toISOString(),
          })
          .select('*')
          .maybeSingle();

        if (!insertError && inserted) {
          synced.push(mapSoundscapeRecipeRow(inserted));
        } else {
          synced.push(recipe);
        }
      }

      if (!cancelled && synced.length > 0) {
        setCustomRecipes(synced);
        setJson('soundscape-custom-recipes', synced);
      }
    };

    loadRecipes();
    return () => {
      cancelled = true;
    };
  }, [userId, getToken]);

  // Combine default and custom recipes
  const focusRecipes = [...defaultRecipes, ...customRecipes];

  // Load soundscape state from Supabase
  useEffect(() => {
    if (!userId) return;
    const supabase = getSupabase();
    if (!supabase) return;
    let cancelled = false;
    const loadState = async () => {
      try {
        const { data, error } = await supabase
          .from('soundscape_state')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        if (cancelled) return;
        if (!error && data && !localMixEditedRef.current) {
          const masterVolume = typeof data.master_volume === 'number' ? data.master_volume : 75;
          const rawSpaces = typeof data.spaces_volume === 'number' ? data.spaces_volume : getSpacesVolume();
          const baseSpacesVolume = rawSpaces > 0 ? rawSpaces : 50;
          setGlobalVolume(masterVolume);
          setSpacesVolumeState(baseSpacesVolume);
          persistSpacesVolume(baseSpacesVolume);
          setItem('soundscape-global-volume', masterVolume.toString());
          const savedSounds = Array.isArray(data.active_sounds) ? data.active_sounds : [];
          const normalizedSounds = enforceSingleInstanceCategories(
            savedSounds.map((sound) => normalizeActiveSound(sound)).filter(Boolean)
          );
          setActiveSounds(normalizedSounds);
          setJson('soundscape-active-sounds', normalizedSounds);
        }
      } finally {
        stateHydratedRef.current = true;
      }
    };
    loadState();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Re-apply from cache when hydration completes (after login), so soundscape and Spaces volume restore
  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;
    const onHydrated = () => {
      const savedVolume = getItem('soundscape-global-volume');
      if (savedVolume) setGlobalVolume(parseInt(savedVolume, 10) || 75);
      const savedSounds = getJson('soundscape-active-sounds');
      if (
        !localMixEditedRef.current &&
        Array.isArray(savedSounds) &&
        savedSounds.length > 0
      ) {
        const normalized = enforceSingleInstanceCategories(
          savedSounds.map((sound) => normalizeActiveSound(sound)).filter(Boolean)
        );
        setActiveSounds(normalized);
      }
      const sessionActive = getItem('soundscape-session-active') === 'true';
      const savedPlaying = getItem('soundscape-is-playing');
      if (savedPlaying !== null) {
        const shouldPlay = sessionActive && savedPlaying === 'true';
        setIsPlaying(shouldPlay);
        if (shouldPlay) {
          hasStartedPlaybackRef.current = true;
        }
      }
      if (sessionActive && savedPlaying === 'true') {
        void restorePersistedPlayback();
      }
      const savedSpacesVol = getItem('focus-video-volume');
      if (savedSpacesVol !== null) {
        const v = parseInt(savedSpacesVol, 10);
        const base = Number.isNaN(v) ? 50 : Math.max(0, Math.min(100, v));
        setSpacesVolumeState(base);
        if (base > 0) {
          saveSpacesPreviousVolume(base);
        }
        if (focusContext?.volume !== base) {
          persistSpacesVolume(base);
        }
      }
    };
    window.addEventListener('user-preferences-hydrated', onHydrated);
    return () => window.removeEventListener('user-preferences-hydrated', onHydrated);
  }, [userId, restorePersistedPlayback]);

  // Reconnect module-level audio elements after hot reload / rare remounts
  useEffect(() => {
    activeSounds.forEach((sound) => {
      const src = SOUNDSCAPE_SOUND_FILES[sound.id];
      if (!src) return;
      if (!audioRefs.current[sound.id]) {
        const { audio } = getOrCreateSoundscapeAudio(sound.id, src);
        audioRefs.current[sound.id] = audio;
      }
    });
  }, []);

  // SoundIcon component
  const SoundIcon = ({ soundId, className = "w-6 h-6" }) => {
    const iconKey = getSoundscapeSoundIcon(soundId);
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
      ocean: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 14c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0M4 10c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0" />
        </svg>
      ),
      thunder: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      breeze: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.5 8c1.5-2 4-2.5 6-1M4 12h11M6 16c1.5 2 4 2.5 6 1" />
        </svg>
      ),
      cafe: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 8h10v6a4 4 0 01-4 4H8a4 4 0 01-4-4V8zm12 2h1a3 3 0 010 6h-1M8 4v2m4-2v2" />
        </svg>
      ),
      office: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
        </svg>
      ),
      neural: (
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4-8 4 6 4-10 4 12" />
        </svg>
      ),
      piano: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 19V5h12v14H6zm3-14v6m3-6v6m3-6v6" />
        </svg>
      ),
      jazz: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      ),
      ambient: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3a9 9 0 100 18 9 9 0 000-18zm0 0v18m-4.5-9H12" />
        </svg>
      ),
      classical: (
        <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 18V5l10-2v13M9 18c0 1.1-1.3 2-3 2s-3-.9-3-2 1.3-2 3-2 3 .9 3 2zm10-2c0 1.1-1.3 2-3 2s-3-.9-3-2 1.3-2 3-2 3 .9 3 2z" />
        </svg>
      ),
    };
    return icons[iconKey] || icons.neural;
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

  const clearAudioFade = (soundId) => {
    if (!soundId) return;
    const intervalId = fadeIntervalsRef.current[soundId];
    if (intervalId) {
      clearInterval(intervalId);
      delete fadeIntervalsRef.current[soundId];
    }
    fadingSoundIdsRef.current.delete(soundId);
  };

  const clearAllAudioFades = () => {
    Object.keys(fadeIntervalsRef.current).forEach((soundId) => clearAudioFade(soundId));
  };

  const resolveMasterVolumeForPlayback = (restoreIfZero = false) => {
    let masterVol = globalVolumeRef.current;
    if (masterVol > 0 || !restoreIfZero) return masterVol;
    const restored =
      previousGlobalVolumeRef.current > 0 ? previousGlobalVolumeRef.current : 75;
    globalVolumeRef.current = restored;
    setGlobalVolume(restored);
    setItem('soundscape-global-volume', restored.toString());
    return restored;
  };

  const getSoundTargetVolume = (sound, masterVol, soloId) => {
    const base = (sound.volume / 100) * (masterVol / 100);
    if (soloId !== null && sound.id !== soloId) return 0;
    return base;
  };

  const clearSoundFades = (soundId) => {
    if (!soundId) return;
    clearAudioFade(soundId);
    clearAudioFade(`out:${soundId}`);
    const audio = audioRefs.current[soundId];
    if (!audio?.src) return;
    try {
      clearAudioFade(new URL(audio.src, window.location.origin).href);
    } catch {
      clearAudioFade(audio.src);
    }
  };

  const rampSoundVolume = (audio, targetVolume, soundId, duration = VOLUME_RAMP_MS) => {
    if (!audio) return;

    const fadeKey = soundId || audio.src || 'unknown';
    clearAudioFade(fadeKey);

    const startVolume = audio.volume;
    if (Math.abs(startVolume - targetVolume) < 0.001) {
      audio.volume = targetVolume;
      return;
    }

    if (duration <= 0) {
      audio.volume = targetVolume;
      return;
    }

    fadingSoundIdsRef.current.add(fadeKey);
    const startTime = Date.now();

    fadeIntervalsRef.current[fadeKey] = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * (2 - progress);

      audio.volume = startVolume + (targetVolume - startVolume) * eased;

      if (progress >= 1) {
        audio.volume = targetVolume;
        clearAudioFade(fadeKey);
      }
    }, 16);
  };

  const applyLayerVolume = (soundId, targetVolume, { immediate = false } = {}) => {
    const audio = audioRefs.current[soundId];
    if (!audio) return;

    clearSoundFades(soundId);

    if (targetVolume > 0 && audio.paused) {
      void audio.play().catch(() => {});
    }

    if (immediate) {
      audio.volume = targetVolume;
      return;
    }

    rampSoundVolume(audio, targetVolume, soundId);
  };

  /** Set one layer's output level immediately (slider drag — never pause the element). */
  const setLayerVolumeImmediate = (soundId, targetVolume) => {
    let audio = audioRefs.current[soundId];
    if (!audio) {
      const src = SOUNDSCAPE_SOUND_FILES[soundId];
      if (!src) return;
      const { audio: el } = getOrCreateSoundscapeAudio(soundId, src);
      audio = el;
      audioRefs.current[soundId] = audio;
    }

    clearSoundFades(soundId);
    audio.volume = Math.max(0, targetVolume);

    if (targetVolume > 0) {
      hasStartedPlaybackRef.current = true;
      if (!isPlayingRef.current) {
        isPlayingRef.current = true;
        setSessionActive(true);
        setIsPlaying(true);
        setItem('soundscape-is-playing', 'true');
        setItem('soundscape-session-active', 'true');
      }
      if (audio.paused) {
        void audio.play().catch(() => {});
      }
    }
  };

  /** Apply master volume to every active layer immediately while dragging the main slider. */
  const applyMasterVolumeToMix = (masterVol) => {
    activeSoundsRef.current.forEach((sound) => {
      const vol = getSoundTargetVolume(sound, masterVol, soloSoundIdRef.current);
      setLayerVolumeImmediate(sound.id, vol);
    });
  };

  // Helper function to fade out audio smoothly (cancellable; keeps shared cache src intact)
  const fadeOutAudio = (audio, duration = 500, soundId = null) => {
    return new Promise((resolve) => {
      if (!audio) {
        resolve();
        return;
      }

      const fadeKey = soundId ? `out:${soundId}` : `out:${audio.src || 'unknown'}`;
      clearAudioFade(fadeKey);
      if (soundId) clearAudioFade(soundId);

      const startVolume = audio.volume;
      const startTime = Date.now();
      fadingSoundIdsRef.current.add(fadeKey);

      fadeIntervalsRef.current[fadeKey] = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        audio.volume = startVolume * (1 - progress);

        if (progress >= 1) {
          clearAudioFade(fadeKey);
          audio.pause();
          resolve();
        }
      }, 16);
    });
  };

  // Helper function to fade in audio smoothly (starts playback at once, ramps volume)
  const fadeInAudio = (audio, targetVolume, duration = PLAYBACK_FADE_MS, soundId = null) => {
    if (!audio || targetVolume <= 0) return;

    const fadeKey = soundId || audio.src || 'unknown';
    clearAudioFade(fadeKey);
    fadingSoundIdsRef.current.add(fadeKey);

    audio.volume = 0;
    void audio.play().catch(() => {
      clearAudioFade(fadeKey);
    });

    const startTime = Date.now();
    fadeIntervalsRef.current[fadeKey] = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = progress * progress;

      audio.volume = targetVolume * eased;

      if (progress >= 1) {
        audio.volume = targetVolume;
        clearAudioFade(fadeKey);
      }
    }, 16);
  };

  const syncAudioRefsFromEngine = (sounds) => {
    sounds.forEach((sound) => {
      const audio = getSoundscapeAudio(sound.id);
      if (audio) audioRefs.current[sound.id] = audio;
    });
  };

  const startActiveSoundsPlayback = useCallback(({ immediate = false } = {}) => {
    const sounds = activeSoundsRef.current;
    const masterVol = resolveMasterVolumeForPlayback(true);
    const soloId = soloSoundIdRef.current;

    if (immediate) {
      playSoundscapeMixImmediate(sounds, masterVol, soloId);
      syncAudioRefsFromEngine(sounds);
      return;
    }

    sounds.forEach((sound) => {
      const src = SOUNDSCAPE_SOUND_FILES[sound.id];
      if (!src) return;

      const { audio } = getOrCreateSoundscapeAudio(sound.id, src);
      audioRefs.current[sound.id] = audio;
      const targetVolume = getSoundTargetVolume(sound, masterVol, soloId);
      if (targetVolume <= 0) {
        audio.pause();
        return;
      }
      fadeInAudio(audio, targetVolume, PLAYBACK_FADE_MS, sound.id);
    });
  }, []);

  const resumeSpacesPlaybackFromWidget = useCallback(({ immediate = false } = {}) => {
    if (typeof window === 'undefined') return;
    if (isSpacesPausedByUser()) return;
    if (!getBackgroundVideoId() || getSpacesVolume() <= 0) return;

    setItem('focus-spaces-paused', 'false');
    setSpacesMuted(false);
    if (!immediate) {
      window.dispatchEvent(new CustomEvent('focus-spaces-activate'));
    }
    lastPlaybackVolumeRef.current = null;
    dispatchSpacesPlaybackVolume(getSpacesVolume(), {
      forceLevel: true,
      rampMs: immediate ? 0 : PLAYBACK_FADE_MS,
    });
    if (!immediate) {
      window.dispatchEvent(new CustomEvent('focus-spaces-resume'));
    }
  }, [userId, spacesVolume]);

  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return;
    const warm = () => warmSoundscapeMix(activeSoundsRef.current);
    warm();
    const onVisible = () => {
      if (document.visibilityState === 'visible') warm();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [activeSounds, userId]);

  // Defer hydration flag only — sounds load synchronously from localStorage on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    initializedRef.current = true;
  }, []);

  // Listen for base volume changes from SpacesDrawer (ignore playback-only ducking events)
  useEffect(() => {
    const handleVolumeChange = (e) => {
      if (e.detail?.playbackOnly) return;
      if (isUpdatingFromComposerRef.current) return;

      const newVolume = e.detail?.volume;
      if (newVolume !== undefined) {
        setSpacesVolumeState(Math.max(0, Math.min(100, newVolume)));
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus-volume-changed', handleVolumeChange);
      return () => {
        window.removeEventListener('focus-volume-changed', handleVolumeChange);
      };
    }
  }, []);

  const syncSpacesPlaybackVolume = useCallback(() => {
    if (!getBackgroundVideoId()) return;
    const playbackVolume = getEffectiveSpacesVolume(spacesVolume);
    if (lastPlaybackVolumeRef.current === playbackVolume) return;
    lastPlaybackVolumeRef.current = playbackVolume;
    dispatchSpacesPlaybackVolume(spacesVolume);
  }, [spacesVolume, globalVolume, isPlaying, soloSoundId, pathname]);

  // Keep Spaces playback volume in sync (ducking while soundscape layers play)
  useEffect(() => {
    const onFocus = pathname?.startsWith('/focus');
    prevPathnameRef.current = pathname;
    if (!getBackgroundVideoId()) return;

    if (!isPlaying) {
      if (lastPlaybackVolumeRef.current !== 0) {
        lastPlaybackVolumeRef.current = 0;
        dispatchSpacesPlaybackVolume(0, { forceLevel: true });
      }
      return;
    }

    if (onFocus && !isSpacesPausedByUser()) {
      bootstrapSpacesPlayback();
      return;
    }

    if (!isSpacesPlaybackActive()) return;

    const playbackVolume = getEffectiveSpacesVolume(spacesVolume);
    if (lastPlaybackVolumeRef.current === playbackVolume) return;
    lastPlaybackVolumeRef.current = playbackVolume;
    dispatchSpacesPlaybackVolume(spacesVolume);
  }, [spacesVolume, globalVolume, isPlaying, soloSoundId, pathname, bootstrapSpacesPlayback]);

  useEffect(() => {
    const handleSpacesResume = () => {
      bootstrapSpacesPlayback();
    };
    window.addEventListener('focus-spaces-resume', handleSpacesResume);
    return () => window.removeEventListener('focus-spaces-resume', handleSpacesResume);
  }, [bootstrapSpacesPlayback]);

  useEffect(() => {
    const handleVideoChanged = () => {
      if (typeof window === 'undefined') return;
      if (!getBackgroundVideoId()) return;
      if (isSpacesPausedByUser()) return;
      lastPlaybackVolumeRef.current = null;
      bootstrapSpacesPlayback();
    };
    window.addEventListener('focus-video-changed', handleVideoChanged);
    return () => window.removeEventListener('focus-video-changed', handleVideoChanged);
  }, [bootstrapSpacesPlayback, userId]);

  useEffect(() => {
    const handlePlayerReady = () => {
      if (!isSpacesPlaybackActive()) return;
      bootstrapSpacesPlayback();
    };
    window.addEventListener('focus-spaces-player-ready', handlePlayerReady);
    return () => window.removeEventListener('focus-spaces-player-ready', handlePlayerReady);
  }, [bootstrapSpacesPlayback, userId]);

  // Save play/pause state to localStorage
  useEffect(() => {
    if (typeof window === 'undefined' || !initializedRef.current) return;
    if (volumeSliderActiveRef.current) return;
    setItem('soundscape-is-playing', isPlaying.toString());
    setItem('soundscape-session-active', isPlaying ? 'true' : 'false');
  }, [isPlaying, userId]);

  const handlePlayPauseChange = useCallback((e) => {
    if (e.detail?.isPlaying === undefined) return;
    const nextPlaying = e.detail.isPlaying;
    if (volumeSliderActiveRef.current && !nextPlaying) return;
    if (e.detail.syncOnly) {
      if (volumeSliderActiveRef.current && !nextPlaying) return;
      setItem('soundscape-is-playing', nextPlaying ? 'true' : 'false');
      setItem('soundscape-session-active', nextPlaying ? 'true' : 'false');
      if (nextPlaying) {
        hasStartedPlaybackRef.current = true;
        setSessionActive(true);
        setIsPlaying(true);
      } else {
        setSessionActive(false);
        setIsPlaying(false);
      }
      return;
    }
    const immediate = Boolean(e.detail.immediate);
    setItem('soundscape-is-playing', nextPlaying ? 'true' : 'false');
    setItem('soundscape-session-active', nextPlaying ? 'true' : 'false');
    if (nextPlaying) {
      hasStartedPlaybackRef.current = true;
      setSessionActive(true);
      if (e.detail.bootstrapSpaces) {
        setItem('focus-spaces-paused', 'false');
        setSpacesMuted(false);
        bootstrapSpacesAudioIfEmpty();
      }
      resumeSpacesPlaybackFromWidget({ immediate });
      if (!volumeSliderActiveRef.current) {
        startActiveSoundsPlayback({ immediate: true });
      }
      setIsPlaying(true);
    } else {
      if (volumeSliderActiveRef.current) return;
      clearAllAudioFades();
      setSessionActive(false);
      setIsPlaying(false);
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) audio.pause();
      });
      if (e.detail.muteSpaces) {
        masterMutedSpacesRef.current = false;
        setSpacesMuted(true);
        setItem('focus-spaces-paused', 'true');
        lastPlaybackVolumeRef.current = null;
        dispatchSpacesPlaybackVolume(0, { forceLevel: true });
      } else {
        lastPlaybackVolumeRef.current = 0;
        dispatchSpacesPlaybackVolume(0, { forceLevel: true });
      }
    }
  }, [resumeSpacesPlaybackFromWidget, startActiveSoundsPlayback, userId]);

  // Listen for play/pause changes from MusicWidget / home dashboard / composer controls
  useEffect(() => {
    window.addEventListener('soundscape-play-pause-changed', handlePlayPauseChange);

    return () => {
      window.removeEventListener('soundscape-play-pause-changed', handlePlayPauseChange);
    };
  }, [handlePlayPauseChange]);

  // Initialize and manage audio - keep playing even when modal is closed
  useEffect(() => {
    activeSounds.forEach((sound) => {
      const src = SOUNDSCAPE_SOUND_FILES[sound.id];
      if (!src) return;

      if (!audioRefs.current[sound.id]) {
        const { audio, created } = getOrCreateSoundscapeAudio(sound.id, src);
        audioRefs.current[sound.id] = audio;
        const targetVolume = getSoundTargetVolume(
          sound,
          globalVolumeRef.current,
          soloSoundId,
        );
        if (created && isPlaying && targetVolume > 0) {
          fadeInAudio(audio, targetVolume, 500, sound.id);
        } else {
          audio.volume = targetVolume;
        }
      }
    });

    Object.keys(audioRefs.current).forEach((soundId) => {
      const audio = audioRefs.current[soundId];
      if (!audio) return;
      if (!isPlaying || volumeSliderActiveRef.current) return;

      if (audio.paused && !fadingSoundIdsRef.current.has(soundId) && !fadingSoundIdsRef.current.has(`out:${soundId}`)) {
        const sound = activeSounds.find((s) => s.id === soundId);
        if (sound) {
          const targetVolume = getSoundTargetVolume(
            sound,
            resolveMasterVolumeForPlayback(true),
            soloSoundId,
          );
          if (targetVolume > 0) {
            fadeInAudio(audio, targetVolume, PLAYBACK_FADE_MS, soundId);
          }
        }
      }
    });

    Object.keys(audioRefs.current).forEach(async (soundId) => {
      if (!activeSounds.some((s) => s.id === soundId)) {
        const audio = audioRefs.current[soundId];
        if (audio) {
          await fadeOutAudio(audio, 500, soundId);
          if (!activeSoundsRef.current.some((s) => s.id === soundId)) {
            delete audioRefs.current[soundId];
            delete soundscapeSoundTimestamps[soundId];
            removeSoundscapeAudio(soundId);
          }
        }
      }
    });
  }, [activeSounds, globalVolume, isPlaying, audioSyncKey, soloSoundId]);

  // Keep soundscape audio running after client-side navigation
  useEffect(() => {
    if (!isPlaying || !hasStartedPlaybackRef.current) return;
    Object.values(audioRefs.current).forEach((audio) => {
      if (audio?.paused) {
        audio.play().catch(() => {});
      }
    });
  }, [pathname, isPlaying]);

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
        const audio = audioRefs.current[sound.id];
        if (audio) {
          fadeOutAudio(audio, 500).then(() => {
            delete audioRefs.current[sound.id];
          });
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
    setItem('soundscape-global-volume', globalVolume.toString());
  }, [globalVolume]);

  // Save active sounds to localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!initializedRef.current) return; // Don't save during initialization
    setJson('soundscape-active-sounds', activeSounds);
  }, [activeSounds]);

  const stopAllSoundscape = () => {
    setIsPlaying(false);
    setActiveSounds([]);
    if (typeof window !== 'undefined') {
      setItem('soundscape-is-playing', 'false');
    }
    Object.keys(audioRefs.current).forEach((soundId) => {
      const audio = audioRefs.current[soundId];
      if (audio) {
        audio.pause();
      }
    });
    audioRefs.current = {};
    soundTimestampsRef.current = {};
    previousVolumesRef.current = {};
    previousGlobalVolumeRef.current = globalVolume || 75;
    stopAllSoundscapeAudioElements();
    dispatchSpacesPlaybackVolume(spacesVolume);
  };

  useEffect(() => {
    const handleStop = () => {
      stopAllSoundscape();
      setSessionActive(false);
      setSpacesMuted(true);
      setItem('soundscape-is-playing', 'false');
      setItem('soundscape-session-active', 'false');
      window.dispatchEvent(
        new CustomEvent('soundscape-play-pause-changed', { detail: { isPlaying: false } })
      );
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('soundscape-stop-all', handleStop);
      return () => {
        window.removeEventListener('soundscape-stop-all', handleStop);
      };
    }
  }, [userId]);

  // Persist soundscape state to Supabase
  useEffect(() => {
    if (!userId) return;
    if (!stateHydratedRef.current) return;
    const supabase = getSupabase();
    if (!supabase) return;
    if (saveStateTimeoutRef.current) {
      clearTimeout(saveStateTimeoutRef.current);
    }
    saveStateTimeoutRef.current = setTimeout(async () => {
      const payload = {
        user_id: userId,
        active_sounds: activeSounds.map((sound) => ({
          id: sound.id,
          volume: sound.volume,
          category: sound.category,
        })),
        master_volume: globalVolume,
        spaces_volume: spacesVolume,
        updated_at: new Date().toISOString(),
      };
      await supabase.from('soundscape_state').upsert(payload, { onConflict: 'user_id' });
    }, 500);
    return () => {
      if (saveStateTimeoutRef.current) {
        clearTimeout(saveStateTimeoutRef.current);
      }
    };
  }, [activeSounds, globalVolume, spacesVolume, userId]);

  // Update audio volumes when they change (skip during slider drag and mid-fade)
  useEffect(() => {
    if (!isPlaying || volumeSliderActiveRef.current) return;
    const masterVol = globalVolumeRef.current;
    activeSounds.forEach((sound) => {
      const audio = audioRefs.current[sound.id];
      if (
        !audio ||
        fadingSoundIdsRef.current.has(sound.id) ||
        fadingSoundIdsRef.current.has(`out:${sound.id}`)
      ) {
        return;
      }

      const vol = getSoundTargetVolume(sound, masterVol, soloSoundId);

      audio.volume = vol;
      if (vol > 0 && audio.paused) {
        void audio.play().catch(() => {});
      }
    });
  }, [activeSounds, globalVolume, soloSoundId, isPlaying]);

  // Sync Spaces volume when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const fromContext = getSpacesVolume();
    setSpacesVolumeState((prev) => (prev === fromContext ? prev : fromContext));
  }, [isOpen, focusContext?.volume]);

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
      
      // Neural & Rhythm: only one of each category at a time
      let soundsToRemove = [];
      if (category === 'Rhythm') {
        soundsToRemove = activeSounds.filter((s) => s.category === 'Rhythm');
      } else if (category === 'Neural') {
        soundsToRemove = activeSounds.filter((s) => s.category === 'Neural');
      }

      // Max 3 layers: remove oldest if still at capacity after category swap
      const remainingAfterExclusive = activeSounds.filter(
        (s) => !soundsToRemove.some((r) => r.id === s.id)
      );
      if (remainingAfterExclusive.length >= 3) {
        const soundsToConsider = remainingAfterExclusive;
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
      
      activeSoundsRef.current = finalSounds;
      setActiveSounds(finalSounds);
      
      // Handle solo state immediately
      soundsToRemove.forEach(soundToRemove => {
        if (soloSoundId === soundToRemove.id) {
          setSoloSoundId(null);
        }
      });
      
      if (SOUNDSCAPE_SOUND_FILES[soundId]) {
        localMixEditedRef.current = true;
        setJson('soundscape-active-sounds', finalSounds);
        finalSounds.forEach((s) => clearSoundFades(s.id));
        const masterVol = resolveMasterVolumeForPlayback(true);
        playSoundscapeMixImmediate(finalSounds, masterVol, soloSoundIdRef.current);
        syncAudioRefsFromEngine(finalSounds);
        ensureSoundscapeSessionPlaying();
      }
      
      // Fade out removed sounds in background (non-blocking)
      soundsToRemove.forEach(soundToRemove => {
        const audio = audioRefs.current[soundToRemove.id];
        if (audio) {
          fadeOutAudio(audio, 500).then(() => {
            delete audioRefs.current[soundToRemove.id];
          });
        }
      });
    }
  };

  const beginVolumeSliderDrag = (key) => {
    volumeSliderActiveRef.current = key;
    localMixEditedRef.current = true;
  };

  const endVolumeSliderDrag = () => {
    volumeSliderActiveRef.current = null;
  };

  const handleSoundVolumeChange = (soundId, rawVolume) => {
    const newVolume = parseInt(rawVolume, 10);
    if (Number.isNaN(newVolume)) return;
    const clamped = Math.max(0, Math.min(100, newVolume));

    const nextSounds = activeSoundsRef.current.map((s) =>
      s.id === soundId ? { ...s, volume: clamped } : s
    );
    activeSoundsRef.current = nextSounds;
    setActiveSounds(nextSounds);

    const sound = nextSounds.find((s) => s.id === soundId);
    if (!sound) return;

    let masterVol = globalVolumeRef.current;
    if (clamped > 0 && masterVol === 0) {
      masterVol = resolveMasterVolumeForPlayback(true);
    }

    const targetVolume = getSoundTargetVolume(
      sound,
      masterVol,
      soloSoundIdRef.current,
    );
    setLayerVolumeImmediate(soundId, targetVolume);
  };

  const handleSoundVolumeCommit = (soundId, rawVolume) => {
    handleSoundVolumeChange(soundId, rawVolume);
    endVolumeSliderDrag();
    setJson('soundscape-active-sounds', activeSoundsRef.current);
    const sound = activeSoundsRef.current.find((s) => s.id === soundId);
    if (sound && sound.volume > 0) {
      const targetVolume = getSoundTargetVolume(
        sound,
        globalVolumeRef.current,
        soloSoundIdRef.current,
      );
      setLayerVolumeImmediate(soundId, targetVolume);
    }
  };

  const handleGlobalVolumeLive = (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (e?.stopPropagation) e.stopPropagation();
    const raw = e?.currentTarget?.value ?? e?.target?.value;
    const newVolume = parseInt(raw, 10);
    if (Number.isNaN(newVolume) || newVolume < 0 || newVolume > 100) return;

    if (newVolume > 0 && globalVolume === 0) {
      previousGlobalVolumeRef.current = newVolume;
    } else if (newVolume === 0 && globalVolume > 0) {
      previousGlobalVolumeRef.current = globalVolume;
    }
    globalVolumeRef.current = newVolume;
    setGlobalVolume(newVolume);
    applyMasterVolumeToMix(newVolume);
  };

  const handleGlobalVolumeCommit = (e) => {
    if (e?.currentTarget?.value !== undefined) {
      handleGlobalVolumeLive(e);
    }
    endVolumeSliderDrag();
    setItem('soundscape-global-volume', globalVolumeRef.current.toString());
    applyMasterVolumeToMix(globalVolumeRef.current);
  };

  const applyTimerRecipe = (recipe) => {
    if (!recipe) return;
    const normalized = normalizeTimerRecipe(recipe);
    if (!normalized) return;
    setTimerMode(normalized.timerMode);
    setSessionMinutes(normalized.sessionMinutes);
    setShortBreakMinutes(normalized.shortBreakMinutes);
    setLongBreakMinutes(normalized.longBreakMinutes);
    setCountdownMinutes(normalized.countdownMinutes);
    setAutoStartBreaks(normalized.autoStartBreaks);
    setAlarmVolume(normalized.alarmVolume);
    setTickSound(normalized.tickSound);
    setDurationInputStr({
      session: String(normalized.sessionMinutes),
      shortBreak: String(normalized.shortBreakMinutes),
      longBreak: String(normalized.longBreakMinutes),
      countdown: String(normalized.countdownMinutes),
    });
  };

  const deleteTimerRecipe = async (recipeId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const nextRecipes = customTimerRecipes.filter((recipe) => recipe.id !== recipeId);
    setCustomTimerRecipes(nextRecipes);
    setJson('focus-timer-custom-recipes', nextRecipes);
    await setFocusTimerRecipesToSupabase(userId, nextRecipes);
  };

  const closeSaveRecipeModal = () => {
    setShowSaveModal(false);
    setRecipeName('');
    setRecipeType('bolt');
    setSaveRecipeModalKind('sound');
  };

  const buildSoundscapeRecipeDraft = () => {
    const soundsToSave = activeSoundsRef.current
      .filter((sound) => sound.id !== 'spaces')
      .map((sound) => ({
        id: sound.id,
        volume: sound.volume,
        category: sound.category,
      }));

    if (isSpacesPlaybackActive() && getBackgroundVideoId() && spacesVolume > 0) {
      soundsToSave.push({ id: 'spaces', volume: spacesVolume, category: 'Atmosphere' });
    }

    return {
      name: recipeName.trim(),
      icon: recipeType,
      sounds: soundsToSave,
      globalVolume: globalVolumeRef.current,
    };
  };

  const appendCustomSoundscapeRecipe = (recipe) => {
    setCustomRecipes((prev) => {
      const updatedCustomRecipes = [...prev, recipe];
      setJson('soundscape-custom-recipes', updatedCustomRecipes);
      return updatedCustomRecipes;
    });
    localMixEditedRef.current = true;
  };

  const handleSaveRecipe = () => {
    if (settingsPanel === 'focusflow') {
      setSaveRecipeModalKind('timer');
      setRecipeName('');
      setRecipeType('bolt');
      setShowSaveModal(true);
      return;
    }
    const layerCount = activeSoundsRef.current.filter((s) => s.id !== 'spaces').length;
    if (layerCount === 0) {
      alert('Please add at least one sound before saving a recipe.');
      return;
    }
    setSaveRecipeModalKind('sound');
    setRecipeName('');
    setRecipeType('bolt');
    setShowSaveModal(true);
  };

  const handleConfirmSaveRecipe = async () => {
    if (!recipeName.trim()) {
      alert('Please enter a recipe name.');
      return;
    }

    if (saveRecipeModalKind === 'timer') {
      if (typeof window !== 'undefined' && userId) {
        try {
          const token = await getClerkSupabaseToken(getToken, Boolean(userId));
          if (token) setSupabaseAuthToken(token);
        } catch (_) {
          // local timer recipe save still works below
        }
      }

      const safeName = recipeName.trim();
      const nameExists = customTimerRecipes.some((r) => r.name.toLowerCase() === safeName.toLowerCase());
      if (nameExists) {
        alert('A timer recipe with this name already exists.');
        return;
      }
      const draftRecipe = normalizeTimerRecipe({
        id: `timer-recipe-${Date.now()}`,
        name: safeName,
        icon: recipeType,
        timerMode,
        sessionMinutes,
        shortBreakMinutes,
        longBreakMinutes,
        countdownMinutes,
        autoStartBreaks,
        alarmVolume,
        tickSound,
        isCustom: true,
        createdAt: new Date().toISOString(),
      });
      if (!draftRecipe) return;
      const nextRecipes = [...customTimerRecipes, draftRecipe];
      setCustomTimerRecipes(nextRecipes);
      setJson('focus-timer-custom-recipes', nextRecipes);
      await setFocusTimerRecipesToSupabase(userId, nextRecipes);
      closeSaveRecipeModal();
      return;
    }

    if (!userId) {
      alert('You must be signed in to save a recipe.');
      return;
    }

    const draft = buildSoundscapeRecipeDraft();
    if (draft.sounds.filter((s) => s.id !== 'spaces').length === 0) {
      alert('Please add at least one sound before saving a recipe.');
      return;
    }

    const nameExists = focusRecipes.some(
      (recipe) => recipe.name.toLowerCase() === draft.name.toLowerCase()
    );
    if (nameExists) {
      alert('A recipe with this name already exists.');
      return;
    }

    try {
      const token = await getClerkSupabaseToken(getToken, Boolean(userId));
      if (token) setSupabaseAuthToken(token);
    } catch (_) {
      // fall back to local save if cloud is unavailable
    }

    let saved = false;
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('soundscape_recipes')
        .insert({
          user_id: userId,
          name: draft.name,
          icon: draft.icon,
          sounds: draft.sounds,
          global_volume: draft.globalVolume,
          updated_at: new Date().toISOString(),
        })
        .select('*')
        .maybeSingle();

      if (!error && data) {
        appendCustomSoundscapeRecipe(mapSoundscapeRecipeRow(data));
        saved = true;
      } else if (process.env.NODE_ENV === 'development' && error) {
        console.error('soundscape_recipes insert failed', error);
      }
    }

    if (!saved) {
      appendCustomSoundscapeRecipe({
        id: `custom-recipe-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: draft.name,
        icon: draft.icon,
        sounds: draft.sounds,
        globalVolume: draft.globalVolume,
        timestamp: Date.now(),
        isCustom: true,
      });
    }

    closeSaveRecipeModal();
  };

  const handleDeleteRecipe = (recipeId, e) => {
    e.stopPropagation();
    const recipe = customRecipes.find(r => r.id === recipeId);
    setRecipeToDelete({ id: recipeId, name: recipe?.name || 'this recipe' });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (recipeToDelete) {
      if (userId && !isLocalSoundscapeRecipeId(recipeToDelete.id)) {
        try {
          const token = await getClerkSupabaseToken(getToken, Boolean(userId));
          if (token) setSupabaseAuthToken(token);
        } catch (_) {
          // local delete still proceeds
        }
        const supabase = getSupabase();
        if (supabase) {
          await supabase
            .from('soundscape_recipes')
            .delete()
            .eq('id', recipeToDelete.id)
            .eq('user_id', userId);
        }
      }
      setCustomRecipes((prev) => {
        const updated = prev.filter((r) => r.id !== recipeToDelete.id);
        setJson('soundscape-custom-recipes', updated);
        return updated;
      });
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
      // Load recipe sounds - filter out invalid sounds (Spaces handled separately)
      const newSounds = recipe.sounds
        .map((sound) => normalizeActiveSound(sound))
        .filter(Boolean);

      const currentVideoId = getBackgroundVideoId();
      const recipeHasSpaces = recipe.sounds.some(s => s.id === 'spaces');
      if (recipeHasSpaces && currentVideoId) {
        const recipeSpacesVolume = recipe.sounds.find(s => s.id === 'spaces')?.volume || 50;
        isUpdatingFromComposerRef.current = true;
        persistSpacesVolume(recipeSpacesVolume);
        setSpacesVolumeState(recipeSpacesVolume);
        setTimeout(() => {
          isUpdatingFromComposerRef.current = false;
        }, 0);
      }

      let finalSounds = enforceSingleInstanceCategories([...newSounds]);
      if (finalSounds.length > 3) {
        finalSounds = finalSounds.slice(-3);
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

      if (finalSounds.length > 0) {
        localMixEditedRef.current = true;
        activeSoundsRef.current = finalSounds;
        setJson('soundscape-active-sounds', finalSounds);
        finalSounds.forEach((s) => clearSoundFades(s.id));
        const masterVol = resolveMasterVolumeForPlayback(true);
        playSoundscapeMixImmediate(finalSounds, masterVol, null);
        syncAudioRefsFromEngine(finalSounds);
        ensureSoundscapeSessionPlaying();
      }

      // Update UI immediately
      setActiveSounds(finalSounds);
      setSoloSoundId(null); // Reset solo when loading a recipe

      // Fade out old sounds in background (non-blocking)
      Object.entries(audioRefs.current)
        .filter(([soundId]) => !finalSounds.some(s => s.id === soundId))
        .forEach(([soundId, audio]) => {
          if (audio) {
            fadeOutAudio(audio, 500, soundId).then(() => {
              if (!activeSoundsRef.current.some((s) => s.id === soundId)) {
                delete audioRefs.current[soundId];
              }
            });
          }
        });
    }
  };

  const handleGlobalVolumeChange = (e) => {
    if (volumeSliderActiveRef.current === 'master') {
      handleGlobalVolumeLive(e);
    } else {
      handleGlobalVolumeCommit(e);
    }
  };

  const handleSoloToggle = (soundId) => {
    // Calculate the new solo state
    const newSoloId = soloSoundId === soundId ? null : soundId;
    
    // Update solo state
    setSoloSoundId(newSoloId);
    
    // Immediately apply solo effect to all sounds
    activeSounds.forEach((sound) => {
      const audio = audioRefs.current[sound.id];
      if (audio) {
        if (newSoloId !== null) {
          if (sound.id === newSoloId) {
            const targetVolume = (sound.volume / 100) * (globalVolume / 100);
            audio.volume = targetVolume;
            if (audio.paused) {
              audio.play().catch(() => {});
            }
          } else {
            audio.volume = 0;
          }
        } else {
          audio.volume = (sound.volume / 100) * (globalVolume / 100);
        }
      }
    });
  };

  const handleSoundMuteToggle = (soundId) => {
    const sound = activeSounds.find(s => s.id === soundId);
    if (!sound) return;

    const currentVolume = sound.volume;
    const volumeMuted = currentVolume === 0;

    if (!isPlaying && !volumeMuted) {
      resumeSoundscapePlayback();
      return;
    }

    if (volumeMuted) {
      const previousVolume = previousVolumesRef.current[soundId] || 50;
      const nextSounds = activeSounds.map((s) =>
        s.id === soundId ? { ...s, volume: previousVolume } : s
      );
      activeSoundsRef.current = nextSounds;
      setActiveSounds(nextSounds);
      delete previousVolumesRef.current[soundId];

      const sound = nextSounds.find((s) => s.id === soundId);
      const targetVolume = getSoundTargetVolume(sound, globalVolume, soloSoundId);
      resumeMixIfAudible(nextSounds, globalVolume, spacesVolume, { restartAudio: false });
      applyLayerVolume(soundId, targetVolume);
      return;
    }

    previousVolumesRef.current[soundId] = currentVolume;
    const nextSounds = activeSounds.map((s) =>
      s.id === soundId ? { ...s, volume: 0 } : s
    );
    setActiveSounds(nextSounds);
    const audio = audioRefs.current[soundId];
    if (audio) {
      audio.volume = 0;
    }
    pauseIfMixInaudible(nextSounds, globalVolume, spacesVolume);
  };

  const handleMasterMuteToggle = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!isPlaying) {
      let nextGlobal = globalVolume;
      if (globalVolume === 0) {
        nextGlobal = previousGlobalVolumeRef.current > 0 ? previousGlobalVolumeRef.current : 75;
        setGlobalVolume(nextGlobal);
      }
      if (nextGlobal > 0 || spacesVolume > 0) {
        resumeSoundscapePlayback();
      }
      return;
    }

    if (globalVolume === 0) {
      const previousVolume = previousGlobalVolumeRef.current > 0 ? previousGlobalVolumeRef.current : 75;
      setGlobalVolume(previousVolume);
    } else {
      previousGlobalVolumeRef.current = globalVolume;
      setGlobalVolume(0);
      pauseIfMixInaudible(activeSounds, 0, spacesVolume);
    }
  };

  const handleSpacesVolumeChange = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const newVolume = parseInt(e.target.value, 10);
    if (Number.isNaN(newVolume) || newVolume < 0 || newVolume > 100) return;

    setSpacesMuted(false);
    masterMutedSpacesRef.current = false;
    lastPlaybackVolumeRef.current = null;
    isUpdatingFromComposerRef.current = true;

    const clamped = applySpacesBaseVolume(userId, spacesVolume, newVolume, { soloSoundId });
    setSpacesVolumeState(clamped);
    if (focusContext?.setVolume) {
      focusContext.setVolume(clamped);
    }

    setTimeout(() => {
      isUpdatingFromComposerRef.current = false;
    }, 0);

    if (newVolume > 0 && !isPlaying && activeSoundsRef.current.some((s) => s.volume > 0)) {
      hasStartedPlaybackRef.current = true;
      setSessionActive(true);
      setIsPlaying(true);
      setItem('soundscape-is-playing', 'true');
      setItem('soundscape-session-active', 'true');
    }
  };

  const handleSpacesMuteToggle = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!isPlaying) {
      let nextSpaces = spacesVolume;
      if (spacesVolume === 0) {
        masterMutedSpacesRef.current = false;
        lastPlaybackVolumeRef.current = null;
        isUpdatingFromComposerRef.current = true;
        nextSpaces = applySpacesBaseVolume(
          userId,
          spacesVolume,
          getSpacesPreviousVolume(),
          { soloSoundId },
        );
        setSpacesVolumeState(nextSpaces);
        if (focusContext?.setVolume) {
          focusContext.setVolume(nextSpaces);
        }
        setTimeout(() => {
          isUpdatingFromComposerRef.current = false;
        }, 0);
      }
      if (globalVolume > 0 || nextSpaces > 0) {
        resumeSoundscapePlayback();
      }
      return;
    }

    setSpacesMuted(false);
    masterMutedSpacesRef.current = false;
    lastPlaybackVolumeRef.current = null;
    isUpdatingFromComposerRef.current = true;

    const clamped = toggleSpacesMute(userId, spacesVolume, { soloSoundId });
    setSpacesVolumeState(clamped);
    if (focusContext?.setVolume) {
      focusContext.setVolume(clamped);
    }

    setTimeout(() => {
      isUpdatingFromComposerRef.current = false;
    }, 0);

    if (clamped === 0) {
      pauseIfMixInaudible(activeSounds, globalVolume, 0);
    }
  };

  // Check if a recipe matches the current active sounds exactly
  const isRecipeActive = (recipe) => {
    if (!recipe || !recipe.sounds || recipe.sounds.length === 0) return false;
    
    const currentVideoId = getBackgroundVideoId();
    const spacesIsActive = currentVideoId && spacesVolume > 0;
    
    // Get recipe sound IDs (excluding Spaces for now)
    const recipeSoundIds = recipe.sounds
      .filter(s => s.id !== 'spaces')
      .map(s => s.id)
      .sort();
    
    // Get active sound IDs (excluding Spaces) - only sounds that are actually playing
    // Check if audio ref exists (sound is actually playing)
    const activeSoundIds = activeSounds
      .filter(s => !!audioRefs.current[s.id])
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
      const audio = audioRefs.current[sound.id];
      return !!audio;
    })
    .filter((sound, index, self) => 
      index === self.findIndex(s => s.id === sound.id)
    );

  const showMainSliderMuted = globalVolume === 0 || !isPlaying;
  const showSpacesSliderMuted = spacesVolume === 0 || !isPlaying;

  const focusFlowSessionsToday = isOpen && settingsPanel === 'focusflow' && userId && typeof window !== 'undefined'
    ? (() => {
        try {
          const today = new Date().toISOString().slice(0, 10);
          const d = getItem('focus-timer-sessions-date');
          const n = getItem('focus-timer-sessions-today');
          if (d !== today || n == null) return 0;
          const x = parseInt(n, 10);
          return Number.isNaN(x) ? 0 : Math.max(0, x);
        } catch {
          return 0;
        }
      })()
    : 0;

  const modalContent = (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ease-out ${
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
      <div className={`relative w-full max-w-[1000px] bg-[#0f0f12] rounded-3xl shadow-[0_24px_80px_-24px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 ease-out ${
        isOpen 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 translate-y-4'
      }`}>
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/[0.06]">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Settings</h2>
            <p className="text-white/50 text-sm mt-1">
              {settingsPanel === 'composer'
                ? `Mixing ${playableSounds.length} layers`
                : settingsPanel === 'integrations'
                  ? 'Google Calendar & Gmail'
                  : 'Timer, presets & sound'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {settingsPanel === 'composer' && (
              <button 
                onClick={() => {
                  if (typeof window === 'undefined') return;
                  const newPlayingState = !isPlaying;
                  setItem('soundscape-is-playing', newPlayingState ? 'true' : 'false');
                  setItem('soundscape-session-active', newPlayingState ? 'true' : 'false');
                  setSessionActive(newPlayingState);
                  if (newPlayingState) {
                    activeSoundsRef.current = activeSounds;
                    setJson('soundscape-active-sounds', activeSounds);
                    hasStartedPlaybackRef.current = true;
                    const masterVol = resolveMasterVolumeForPlayback(true);
                    playSoundscapeMixImmediate(activeSounds, masterVol, soloSoundIdRef.current);
                    syncAudioRefsFromEngine(activeSounds);
                    lastPlaybackVolumeRef.current = null;
                    if (getBackgroundVideoId() && spacesVolume > 0) {
                      dispatchSpacesPlaybackVolume(spacesVolume, { forceLevel: true, rampMs: 0 });
                    }
                  } else {
                    lastPlaybackVolumeRef.current = 0;
                    dispatchSpacesPlaybackVolume(0, { forceLevel: true });
                  }
                  window.dispatchEvent(new CustomEvent('soundscape-state-changed'));
                  window.dispatchEvent(new CustomEvent('soundscape-play-pause-changed', {
                    detail: {
                      isPlaying: newPlayingState,
                      bootstrapSpaces: newPlayingState,
                      immediate: newPlayingState,
                    },
                  }));
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
            )}
            {settingsPanel !== 'integrations' &&
              !(settingsPanel === 'focusflow' && timerMode === 'stopwatch') && (
              <button 
                data-save-recipe
                onClick={handleSaveRecipe}
                className="px-5 py-2 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-sm font-medium rounded-full transition-colors"
              >
                Save Recipe
              </button>
            )}
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

        {/* BODY: Sidebar + Content */}
        <div className="flex flex-1 min-h-0">
          {/* LEFT SIDEBAR */}
          <div className="w-[200px] shrink-0 border-r border-white/[0.06] bg-[#0c0c0e]/80 flex flex-col py-5 px-3">
            <div className="text-white/40 text-xs font-medium tracking-wide mb-3 px-3">Panel</div>
            <button
              onClick={() => setSettingsPanel('composer')}
              className={`mb-1.5 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all duration-200 ${
                settingsPanel === 'composer'
                  ? 'bg-[#8b5cf6] text-white shadow-[0_0_16px_rgba(139,92,246,0.25)]'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              Composer
            </button>
            <button
              onClick={() => setSettingsPanel('focusflow')}
              className={`mb-1.5 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all duration-200 ${
                settingsPanel === 'focusflow'
                  ? 'bg-[#8b5cf6] text-white shadow-[0_0_16px_rgba(139,92,246,0.25)]'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              Focus Flow
            </button>
            <button
              onClick={() => setSettingsPanel('integrations')}
              className={`px-4 py-3 rounded-xl text-left text-sm font-medium transition-all duration-200 ${
                settingsPanel === 'integrations'
                  ? 'bg-[#8b5cf6] text-white shadow-[0_0_16px_rgba(139,92,246,0.25)]'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              Integrations
            </button>
          </div>

          {/* RIGHT CONTENT */}
          <div className="flex-1 overflow-y-auto custom-scrollbar min-w-0">
            {settingsPanel === 'focusflow' ? (
              /* FOCUS FLOW PANEL */
              <div className="p-8 max-w-2xl mx-auto space-y-8 bg-gradient-to-b from-[#0f0f12] via-[#0f0f12] to-[#0a0a0c]">
                {/* Hero: Timer display + Apply */}
                <div className="relative text-center rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-b from-[#1a1a1f] to-[#121214] p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_24px_48px_-12px_rgba(0,0,0,0.4)]">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.12),transparent)] pointer-events-none" />
                  <div className="relative">
                    <div
                      className="text-7xl font-bold text-white tracking-[-0.04em] tabular-nums mb-1"
                      style={{ textShadow: '0 0 60px rgba(139,92,246,0.2), 0 2px 0 rgba(0,0,0,0.2)' }}
                    >
                      {timerMode === 'countdown'
                        ? `${String(countdownMinutes).padStart(2, '0')}:00`
                        : timerMode === 'pomodoro'
                          ? `${String(sessionMinutes).padStart(2, '0')}:00`
                          : '00:00'}
                    </div>
                    <p className="text-white/40 text-sm font-medium mb-5">Timer preview</p>
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/70 text-sm mb-6">
                      <span className="w-2 h-2 rounded-full bg-[#8b5cf6] shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                      {focusFlowSessionsToday} of 8 sessions today
                    </div>
                    <button
                      onClick={() => {
                        setItem('focus-settings-timer-mode', timerMode);
                        setItem('focus-settings-session-minutes', sessionMinutes.toString());
                        setItem('focus-settings-short-break-minutes', shortBreakMinutes.toString());
                        setItem('focus-settings-long-break-minutes', longBreakMinutes.toString());
                        setItem('focus-settings-countdown-minutes', countdownMinutes.toString());
                        setItem('focus-settings-auto-start-breaks', autoStartBreaks ? 'true' : 'false');
                        setItem('focus-settings-alarm-volume', alarmVolume.toString());
                        setItem('focus-settings-tick-sound', tickSound ? 'true' : 'false');
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('focus-settings-applied', {
                            detail: { timerMode, sessionMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes, autoStartBreaks, alarmVolume, tickSound }
                          }));
                        }
                      }}
                      className="px-10 py-4 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-sm font-semibold rounded-2xl transition-all shadow-[0_0_24px_rgba(139,92,246,0.35)] hover:shadow-[0_0_32px_rgba(139,92,246,0.45)] hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Apply settings
                    </button>
                  </div>
                </div>

                {/* Timer Mode */}
                <section className="rounded-2xl border border-white/[0.06] bg-[#141416]/80 p-6 backdrop-blur-sm">
                  <h3 className="text-base font-semibold text-white mb-4">Timer mode</h3>
                  <div className="flex gap-3">
                    {['Pomodoro', 'Stopwatch', 'Countdown'].map((mode) => {
                      const key = mode.toLowerCase();
                      const active = timerMode === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setTimerMode(key)}
                          className={`flex-1 px-5 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                            active
                              ? 'bg-[#8b5cf6] text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]'
                              : 'bg-white/[0.04] text-white/70 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                          }`}
                        >
                          {mode}
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* Pomodoro: Durations + Presets */}
                {timerMode === 'pomodoro' && (
                  <>
                    <section className="rounded-2xl border border-white/[0.06] bg-[#141416]/80 p-6 backdrop-blur-sm">
                      <h3 className="text-base font-semibold text-white mb-4">Durations</h3>
                      <div className="grid grid-cols-3 gap-5">
                        {[
                          { key: 'session', label: 'Session', suffix: 'min', value: sessionMinutes, setter: setSessionMinutes, max: 120 },
                          { key: 'shortBreak', label: 'Short break', suffix: 'min', value: shortBreakMinutes, setter: setShortBreakMinutes, max: 60 },
                          { key: 'longBreak', label: 'Long break', suffix: 'min', value: longBreakMinutes, setter: setLongBreakMinutes, max: 60 },
                        ].map(({ key, label, suffix, value, setter, max }) => (
                          <div key={label}>
                            <label className="block text-white/50 text-sm font-medium mb-2">{label}</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              min={1}
                              max={max}
                              value={durationInputStr[key]}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/\D/g, '');
                                setDurationInputStr((prev) => ({ ...prev, [key]: raw }));
                              }}
                              onBlur={() => {
                                const raw = durationInputStr[key].trim();
                                const n = raw === '' ? value : parseInt(raw, 10);
                                if (Number.isNaN(n) || n < 1) {
                                  setter(Math.max(1, Math.min(max, value)));
                                  setDurationInputStr((prev) => ({ ...prev, [key]: String(value) }));
                                } else {
                                  const clamped = Math.max(1, Math.min(max, n));
                                  setter(clamped);
                                  setDurationInputStr((prev) => ({ ...prev, [key]: String(clamped) }));
                                }
                              }}
                              className="w-full px-4 py-3.5 bg-[#0c0c0e] border border-white/10 rounded-xl text-white text-center text-lg font-semibold tabular-nums focus:outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all"
                            />
                            <span className="block text-white/40 text-xs mt-1.5">{suffix}</span>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section className="rounded-2xl border border-white/[0.06] bg-[#141416]/80 p-6 backdrop-blur-sm">
                      <h3 className="text-base font-semibold text-white mb-4">Quick presets</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { name: 'Deep Work', duration: '25m', icon: 'bulb', mins: 25, type: 'session' },
                          { name: 'Long Session', duration: '50m', icon: 'clock', mins: 50, type: 'session' },
                          { name: 'Short Break', duration: '5m', icon: 'play', mins: 5, type: 'short' },
                          { name: 'Long Break', duration: '15m', icon: 'break', mins: 15, type: 'long' },
                        ].map(({ name, duration, icon, mins, type }) => (
                          <button
                            key={name}
                            onClick={() => {
                              if (type === 'session') {
                                setSessionMinutes(mins);
                                setDurationInputStr((prev) => ({ ...prev, session: String(mins) }));
                              } else if (type === 'short') {
                                setShortBreakMinutes(mins);
                                setDurationInputStr((prev) => ({ ...prev, shortBreak: String(mins) }));
                              } else {
                                setLongBreakMinutes(mins);
                                setDurationInputStr((prev) => ({ ...prev, longBreak: String(mins) }));
                              }
                              setTimerMode('pomodoro');
                            }}
                            className="group flex flex-col items-center gap-2.5 p-4 rounded-xl bg-[#0c0c0e]/80 border border-white/[0.06] hover:border-[#8b5cf6]/30 hover:bg-[#161618] transition-all text-center"
                          >
                            {icon === 'bulb' && <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center ring-1 ring-amber-500/20"><svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg></div>}
                            {icon === 'clock' && <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/15 flex items-center justify-center ring-1 ring-[#8b5cf6]/20"><svg className="w-5 h-5 text-[#a78bfa]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>}
                            {icon === 'play' && <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center ring-1 ring-emerald-500/20"><svg className="w-5 h-5 text-emerald-400 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg></div>}
                            {icon === 'break' && <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center ring-1 ring-rose-500/20"><svg className="w-5 h-5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg></div>}
                            <span className="font-medium text-white group-hover:text-[#a78bfa] transition-colors">{name}</span>
                            <span className="text-white/45 text-xs">{duration}</span>
                          </button>
                        ))}
                      </div>
                    </section>
                  </>
                )}

                {/* Countdown: Duration only */}
                {timerMode === 'countdown' && (
                  <section className="rounded-2xl border border-white/[0.06] bg-[#141416]/80 p-6 backdrop-blur-sm">
                    <h3 className="text-base font-semibold text-white mb-2">Countdown duration</h3>
                    <p className="text-white/50 text-sm mb-4">How long the countdown runs (1–120 minutes).</p>
                    <div className="flex flex-wrap items-end gap-4">
                      <div className="flex-1 min-w-[120px] max-w-[160px]">
                        <label className="block text-white/50 text-sm font-medium mb-2">Minutes</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={durationInputStr.countdown}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/\D/g, '');
                            setDurationInputStr((prev) => ({ ...prev, countdown: raw }));
                          }}
                          onBlur={() => {
                            const raw = durationInputStr.countdown.trim();
                            const n = raw === '' ? countdownMinutes : parseInt(raw, 10);
                            if (Number.isNaN(n) || n < 1) {
                              const fallback = Math.max(1, Math.min(120, countdownMinutes));
                              setCountdownMinutes(fallback);
                              setDurationInputStr((prev) => ({ ...prev, countdown: String(fallback) }));
                            } else {
                              const clamped = Math.max(1, Math.min(120, n));
                              setCountdownMinutes(clamped);
                              setDurationInputStr((prev) => ({ ...prev, countdown: String(clamped) }));
                            }
                          }}
                          className="w-full px-4 py-3.5 bg-[#0c0c0e] border border-white/10 rounded-xl text-white text-center text-lg font-semibold tabular-nums focus:outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition-all"
                        />
                      </div>
                      <span className="text-white/40 text-sm pb-3">min</span>
                    </div>
                  </section>
                )}

                {/* Settings (all modes) */}
                <section className="rounded-2xl border border-white/[0.06] bg-[#141416]/80 p-6 backdrop-blur-sm">
                  <h3 className="text-base font-semibold text-white mb-4">Sound & behavior</h3>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                      <span className="text-white/90 text-sm">Auto-start breaks</span>
                      <button
                        role="switch"
                        aria-checked={autoStartBreaks}
                        onClick={() => setAutoStartBreaks((v) => !v)}
                        className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${autoStartBreaks ? 'bg-[#8b5cf6]' : 'bg-[#27272a]'}`}
                      >
                        <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ease-out ${autoStartBreaks ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-3 px-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                      <span className="text-white/90 text-sm">Alarm volume</span>
                      <div className="flex items-center gap-3 flex-1 max-w-[200px]">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={alarmVolume}
                          onChange={(e) => setAlarmVolume(parseInt(e.target.value, 10) || 0)}
                          className="flex-1 h-2 rounded-full appearance-none cursor-pointer slider-purple"
                          style={{ background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${alarmVolume}%, rgba(255,255,255,0.08) ${alarmVolume}%, rgba(255,255,255,0.08) 100%)` }}
                        />
                        <span className="text-white/80 text-sm font-medium tabular-nums w-10">{alarmVolume}%</span>
                      </div>

                    </div>
                    <div className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                      <span className="text-white/90 text-sm">Tick sound</span>
                      <button
                        role="switch"
                        aria-checked={tickSound}
                        onClick={() => {
                          const next = !tickSound;
                          setTickSound(next);
                          setItem('focus-settings-tick-sound', next ? 'true' : 'false');
                          if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('focus-settings-tick-sound-changed', { detail: { tickSound: next } }));
                          }
                        }}
                        className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${tickSound ? 'bg-[#8b5cf6]' : 'bg-[#27272a]'}`}
                      >
                        <span className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-200 ease-out ${tickSound ? 'right-1' : 'left-1'}`} />
                      </button>
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-white/[0.06] bg-[#141416]/80 p-6 backdrop-blur-sm">
                  <h3 className="text-base font-semibold text-white mb-4">Timer recipes</h3>
                  <div className="flex flex-wrap gap-3">
                    {timerRecipes.map((recipe) => (
                      <div key={recipe.id} className="relative group">
                        <button
                          onClick={() => applyTimerRecipe(recipe)}
                          className="flex items-center gap-4 px-5 py-3.5 rounded-xl bg-[#0c0c0e]/80 border border-white/[0.06] hover:border-[#8b5cf6]/30 hover:bg-[#161618] transition-all"
                        >
                          <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/15 flex items-center justify-center ring-1 ring-[#8b5cf6]/20 text-[#a78bfa]">
                            <RecipeIcon icon={recipe.icon || 'bolt'} className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-white">{recipe.name}</div>
                            <div className="text-xs text-white/50">
                              {recipe.timerMode === 'countdown'
                                ? `${recipe.countdownMinutes} min countdown`
                                : recipe.timerMode === 'stopwatch'
                                  ? 'Stopwatch'
                                  : `${recipe.sessionMinutes}/${recipe.shortBreakMinutes}/${recipe.longBreakMinutes} min`}
                            </div>
                          </div>
                        </button>
                        {recipe.isCustom && (
                          <button
                            onClick={(e) => deleteTimerRecipe(recipe.id, e)}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-[#2d2d36] hover:bg-[#3d3d46] border border-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete timer recipe"
                          >
                            <svg className="w-3 h-3 text-white/60 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            ) : settingsPanel === 'integrations' ? (
              <div className="p-8 max-w-2xl mx-auto bg-gradient-to-b from-[#0f0f12] via-[#0f0f12] to-[#0a0a0c]">
                <WorkspaceIntegrations
                  embedded
                  oauthConnected={integrationsOAuth?.connected}
                  oauthError={integrationsOAuth?.error}
                  onOAuthNoticeConsumed={onIntegrationsOAuthConsumed}
                />
              </div>
            ) : (
              /* COMPOSER PANEL */
              <div className="p-8 space-y-10">
          {/* SECTION 1: ACTIVE MIXER */}
          <section>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-medium text-white">Active Mixer</h3>
              {/* Master + Spaces Volume */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 w-48 opacity-60 hover:opacity-100 transition-opacity">
                <button
                  onClick={handleMasterMuteToggle}
                  type="button"
                  className="shrink-0 transition-colors hover:opacity-100 cursor-pointer p-1 -ml-1"
                  title={
                    !isPlaying
                      ? 'Play all sounds'
                      : globalVolume === 0
                        ? 'Unmute main volume'
                        : 'Mute main volume'
                  }
                  style={{ pointerEvents: 'auto' }}
                >
                  {showMainSliderMuted ? (
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
                  onPointerDown={() => beginVolumeSliderDrag('master')}
                  onPointerUp={handleGlobalVolumeCommit}
                  onPointerCancel={handleGlobalVolumeCommit}
                  onChange={handleGlobalVolumeChange}
                  onInput={handleGlobalVolumeLive}
                  className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer slider-purple"
                  style={{
                    background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${globalVolume}%, rgba(255,255,255,0.1) ${globalVolume}%, rgba(255,255,255,0.1) 100%)`,
                    pointerEvents: 'auto',
                  }}
                />
              </div>
                <div className="flex items-center gap-3 w-48 opacity-60 hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={handleSpacesMuteToggle}
                    className={`shrink-0 flex items-center gap-2 text-xs transition-colors cursor-pointer p-1 -ml-1 ${
                      showSpacesSliderMuted ? 'text-orange-400' : 'text-white/60 hover:text-white'
                    }`}
                    title={
                      showSpacesSliderMuted
                        ? (!isPlaying ? 'Play all sounds' : 'Unmute Spaces audio')
                        : 'Mute Spaces audio'
                    }
                    style={{ pointerEvents: 'auto' }}
                  >
                    {showSpacesSliderMuted ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M7 14l12-12" />
                      </svg>
                    ) : (
                      <SoundIcon soundId="spaces" className="w-4 h-4" />
                    )}
                    <span>Spaces</span>
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={spacesVolume}
                    onChange={handleSpacesVolumeChange}
                    onInput={handleSpacesVolumeChange}
                    className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer slider-purple"
                    style={{
                      background: `linear-gradient(to right, #8b5cf6 0%, #8b5cf6 ${spacesVolume}%, rgba(255,255,255,0.1) ${spacesVolume}%, rgba(255,255,255,0.1) 100%)`,
                      pointerEvents: 'auto',
                    }}
                  />
                </div>
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
                        title={
                          sound.volume === 0
                            ? 'Unmute this sound'
                            : 'Mute this sound'
                        }
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
                      onPointerDown={() => beginVolumeSliderDrag(sound.id)}
                      onPointerUp={(e) => handleSoundVolumeCommit(sound.id, e.currentTarget.value)}
                      onPointerCancel={(e) => handleSoundVolumeCommit(sound.id, e.currentTarget.value)}
                      onInput={(e) => handleSoundVolumeChange(sound.id, e.target.value)}
                      onChange={(e) => handleSoundVolumeChange(sound.id, e.target.value)}
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
                const isActive = activeSounds.some(s => s.id === sound.id);
                return (
                  <button
                    key={sound.id}
                    onClick={() => handleSoundClick(sound.id, activeTab)}
                    className={`
                      relative px-6 py-8 rounded-3xl border transition-all duration-200 flex flex-col items-center justify-center gap-4 group
                      ${isActive 
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
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-8 py-4 bg-[#0a0a0c] border-t border-white/5 flex justify-between items-center text-xs text-white/30">
          <div className="flex items-center gap-2">
            {settingsPanel === 'focusflow' ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-[#8b5cf6]"></div>
                <span>Timer: Paused</span>
              </>
            ) : settingsPanel === 'integrations' ? (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                <span>Google Workspace</span>
              </>
            ) : (
              <>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                <span>Audio Engine: Ready</span>
                <span className="opacity-50">|</span>
                <span>Sample Rate: 48kHz</span>
              </>
            )}
          </div>
          <div>© 2024 ThryvLoop Productivity Inc.</div>
        </div>
      </div>

      {/* Save Recipe Modal */}
      {showSaveModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeSaveRecipeModal}
          />
          <div className="relative bg-[#0f0f12] rounded-2xl border border-white/5 shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-6">
              {saveRecipeModalKind === 'timer' ? 'Save Timer Recipe' : 'Save Recipe'}
            </h3>
            
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
                  placeholder={saveRecipeModalKind === 'timer' ? 'e.g., Morning deep work' : 'e.g., My Focus Mix'}
                  className="w-full px-4 py-2.5 bg-[#18181b] border border-white/5 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirmSaveRecipe();
                    } else if (e.key === 'Escape') {
                      closeSaveRecipeModal();
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
                  onClick={closeSaveRecipeModal}
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
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleCancelDelete}
          />
          <div className="relative bg-[#0f0f12] rounded-2xl border border-white/5 shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
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

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
