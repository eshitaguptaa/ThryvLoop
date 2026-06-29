'use client';

import { useState, useEffect, useCallback } from 'react';
import RecipeIcon from '@/components/soundscape/icons/RecipeIcon';
import {
  getUserStorageJson,
  getFocusTimerRecipesFromSupabase,
  setFocusTimerRecipesToSupabase,
  setSupabaseAuthToken,
} from '@/utils/userStorage';
import { getClerkSupabaseToken } from '@/lib/clerkSupabaseToken';

const DEFAULT_TIMER_RECIPES = [
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

function normalizeTimerRecipe(recipe) {
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
}

export default function FocusFlowSettingsPanel({
  userId,
  getItem,
  setItem,
  setJson,
  getToken,
  onRequestSaveTimerRecipe,
}) {
  const getJson = (key) => getUserStorageJson(userId, key, key);

  const [timerMode, setTimerMode] = useState('pomodoro');
  const [sessionMinutes, setSessionMinutes] = useState(25);
  const [shortBreakMinutes, setShortBreakMinutes] = useState(5);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);
  const [countdownMinutes, setCountdownMinutes] = useState(5);
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);
  const [alarmVolume, setAlarmVolume] = useState(60);
  const [tickSound, setTickSound] = useState(true);
  const [customTimerRecipes, setCustomTimerRecipes] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [recipeName, setRecipeName] = useState('');
  const [recipeType, setRecipeType] = useState('bolt');

  const [durationInputStr, setDurationInputStr] = useState({
    session: '',
    shortBreak: '',
    longBreak: '',
    countdown: '',
  });

  const timerRecipes = [...DEFAULT_TIMER_RECIPES, ...customTimerRecipes];

  const syncBehaviorSettings = useCallback((nextAutoStartBreaks, nextAlarmVolume) => {
    setItem('focus-settings-auto-start-breaks', nextAutoStartBreaks ? 'true' : 'false');
    setItem('focus-settings-alarm-volume', nextAlarmVolume.toString());
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('focus-settings-behavior-changed', {
        detail: { autoStartBreaks: nextAutoStartBreaks, alarmVolume: nextAlarmVolume },
      }));
    }
  }, [setItem]);

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
  }, [userId, getItem]);

  useEffect(() => {
    setDurationInputStr({
      session: String(sessionMinutes),
      shortBreak: String(shortBreakMinutes),
      longBreak: String(longBreakMinutes),
      countdown: String(countdownMinutes),
    });
  }, [sessionMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes]);

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
  }, [userId, setJson]);

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

  const closeSaveTimerRecipeModal = useCallback(() => {
    setShowSaveModal(false);
    setRecipeName('');
    setRecipeType('bolt');
  }, []);

  const openSaveTimerRecipeModal = useCallback(() => {
    setRecipeName('');
    setRecipeType('bolt');
    setShowSaveModal(true);
  }, []);

  useEffect(() => {
    if (typeof onRequestSaveTimerRecipe === 'function') {
      onRequestSaveTimerRecipe(openSaveTimerRecipeModal);
    }
  }, [onRequestSaveTimerRecipe, openSaveTimerRecipeModal]);

  const handleConfirmSaveTimerRecipe = async () => {
    if (!recipeName.trim()) {
      alert('Please enter a recipe name.');
      return;
    }

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
    closeSaveTimerRecipeModal();
  };

  const focusFlowSessionsToday = userId && typeof window !== 'undefined'
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

  return (
    <>
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
                    detail: { timerMode, sessionMinutes, shortBreakMinutes, longBreakMinutes, countdownMinutes, autoStartBreaks, alarmVolume, tickSound },
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
                onClick={() => {
                  const next = !autoStartBreaks;
                  setAutoStartBreaks(next);
                  syncBehaviorSettings(next, alarmVolume);
                }}
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
                  onChange={(e) => {
                    const next = parseInt(e.target.value, 10) || 0;
                    setAlarmVolume(next);
                    syncBehaviorSettings(autoStartBreaks, next);
                  }}
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

      {showSaveModal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closeSaveTimerRecipeModal}
          />
          <div className="relative bg-[#0f0f12] rounded-2xl border border-white/5 shadow-2xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-6">Save Timer Recipe</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Recipe Name
                </label>
                <input
                  type="text"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  placeholder="e.g., Morning deep work"
                  className="w-full px-4 py-2.5 bg-[#18181b] border border-white/5 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleConfirmSaveTimerRecipe();
                    } else if (e.key === 'Escape') {
                      closeSaveTimerRecipeModal();
                    }
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-3">
                  Recipe Type
                </label>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { id: 'bolt', label: 'Bolt' },
                    { id: 'code', label: 'Code' },
                    { id: 'pen', label: 'Pen' },
                    { id: 'lotus', label: 'Lotus' },
                    { id: 'briefcase', label: 'Case' },
                  ].map((type) => (
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

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeSaveTimerRecipeModal}
                  className="flex-1 px-4 py-2.5 bg-[#18181b] hover:bg-[#202024] text-white/70 hover:text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSaveTimerRecipe}
                  className="flex-1 px-4 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg transition-colors font-medium"
                >
                  Save Recipe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
