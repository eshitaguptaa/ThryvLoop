'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Bell,
  Play,
  Pause,
  Calendar,
  Music,
  ArrowUpRight,
  Timer,
  ListTodo,
  ListChecks,
  Focus,
  Video,
  Mail,
} from 'lucide-react';
import { useWorkspace } from '@/hooks/useWorkspace';
import { formatWorkspaceSyncError } from '@/lib/workspace/userMessages';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { getSupabaseClient, setSupabaseAuthToken, getUserStorageItem, getUserStorageJson, setUserStorageItem } from '@/utils/userStorage';
import { localDateKey, localStartOfDay } from '@/lib/dateRanges';
import { useTimer } from '@/contexts/TimerContext';
import { openIntegrationsSettings } from '@/lib/openFocusSettings';

const FOCUS_GOAL_MINUTES = 120; // 2 hours default daily goal
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SOUNDSCAPE_SOUND_NAMES = {
  rain: 'Heavy Rain',
  fire: 'Fire Crackle',
  forest: 'Forest',
  waterfall: 'Waterfall',
  binaural: 'Binaural (40Hz)',
  lofi: 'Chill Lo-Fi',
  synthwave: 'Synthwave',
  spaces: 'Spaces',
};

function formatWorkspaceWhen(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (isToday) return `Today · ${time}`;
  if (isTomorrow) return `Tomorrow · ${time}`;
  return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useUser();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const userId = user?.id || null;
  const displayName = user?.firstName || user?.username || 'there';
  const avatarUrl = user?.imageUrl || 'https://i.pravatar.cc/150?u=default';

  const [weeklyFocusSeconds, setWeeklyFocusSeconds] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [homeLoading, setHomeLoading] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationsRef = useRef(null);
  const productivityTrendRef = useRef(null);
  const [productivityTrendHeight, setProductivityTrendHeight] = useState(null);
  const workspaceSyncedRef = useRef(false);

  const {
    todayFocusSeconds,
    yesterdayLoggedFocusSeconds,
    unloggedFocusSeconds,
    isFocusTimerRunningToday,
  } = useTimer();

  const {
    hasConnection,
    needsWorkspaceSync,
    needsWorkspaceReconnect,
    googleConnection,
    inMeeting,
    currentMeeting,
    upcomingMeetings,
    notifications: workspaceNotifications,
    unreadCount,
    sync: syncWorkspace,
    loading: workspaceLoading,
  } = useWorkspace({ enabled: Boolean(isSignedIn && userId) });

  const [soundscapeIsPlaying, setSoundscapeIsPlaying] = useState(false);
  const [soundscapeActiveSounds, setSoundscapeActiveSounds] = useState([]);
  const [spacesActive, setSpacesActive] = useState(false);

  const syncSoundscapeFromStorage = useCallback((playingOverride) => {
    if (typeof window === 'undefined' || !userId) return;
    const sessionActive =
      getUserStorageItem(userId, 'soundscape-session-active', 'soundscape-session-active') === 'true';
    const playing = getUserStorageItem(userId, 'soundscape-is-playing', 'soundscape-is-playing') === 'true';
    const isPlayingNow =
      playingOverride !== undefined ? playingOverride : sessionActive && playing;
    setSoundscapeIsPlaying(isPlayingNow);
    const raw = getUserStorageJson(userId, 'soundscape-active-sounds', 'soundscape-active-sounds');
    const list = Array.isArray(raw) ? raw : [];
    const videoId = getUserStorageItem(userId, 'focus-background-video-id', 'focus-background-video-id');
    const videoVol = getUserStorageItem(userId, 'focus-video-volume', 'focus-video-volume');
    const spacesPlaying =
      getUserStorageItem(userId, 'focus-spaces-paused', 'focus-spaces-paused') === 'false';
    const spacesOn = !!(
      spacesPlaying &&
      videoId &&
      videoVol &&
      parseInt(videoVol, 10) > 0
    );
    setSpacesActive(spacesOn);
    const withSpaces = list.filter((s) => s.id !== 'spaces');
    if (spacesOn && !list.some((s) => s.id === 'spaces')) {
      withSpaces.push({ id: 'spaces', name: 'Spaces', volume: parseInt(videoVol, 10) || 50 });
    }
    setSoundscapeActiveSounds(
      withSpaces.map((s) => ({ id: s.id, name: SOUNDSCAPE_SOUND_NAMES[s.id] || s.name || s.id }))
    );
    if (spacesOn && !isPlayingNow) {
      setSoundscapeIsPlaying(true);
    }
  }, [userId]);

  useEffect(() => {
    syncSoundscapeFromStorage();
    const interval = setInterval(() => syncSoundscapeFromStorage(), 2000);
    const onPlayPause = (e) => {
      syncSoundscapeFromStorage(
        e.detail?.isPlaying !== undefined ? e.detail.isPlaying : undefined
      );
    };
    const onVolume = () => syncSoundscapeFromStorage();
    const onStop = () => {
      setSoundscapeIsPlaying(false);
      setSoundscapeActiveSounds([]);
      setSpacesActive(false);
    };
    window.addEventListener('soundscape-play-pause-changed', onPlayPause);
    window.addEventListener('soundscape-state-changed', onVolume);
    window.addEventListener('focus-volume-changed', onVolume);
    window.addEventListener('soundscape-stop-all', onStop);
    return () => {
      clearInterval(interval);
      window.removeEventListener('soundscape-play-pause-changed', onPlayPause);
      window.removeEventListener('soundscape-state-changed', onVolume);
      window.removeEventListener('focus-volume-changed', onVolume);
      window.removeEventListener('soundscape-stop-all', onStop);
    };
  }, [userId, syncSoundscapeFromStorage]);

  useEffect(() => {
    const el = productivityTrendRef.current;
    if (!el || typeof window === 'undefined') return;

    const syncHeight = () => {
      if (window.matchMedia('(min-width: 1024px)').matches) {
        setProductivityTrendHeight(el.offsetHeight);
      } else {
        setProductivityTrendHeight(null);
      }
    };

    syncHeight();
    const ro = new ResizeObserver(syncHeight);
    ro.observe(el);
    window.addEventListener('resize', syncHeight);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', syncHeight);
    };
  }, [homeLoading, weeklyFocusSeconds.length]);

  const toggleSoundscapePlayPause = useCallback(() => {
    if (typeof window === 'undefined' || !userId) return;
    const next = !soundscapeIsPlaying;

    setUserStorageItem(userId, 'soundscape-is-playing', next ? 'true' : 'false');
    setUserStorageItem(userId, 'soundscape-session-active', next ? 'true' : 'false');
    if (next) {
      setUserStorageItem(userId, 'focus-spaces-paused', 'false');
    } else {
      setUserStorageItem(userId, 'focus-spaces-paused', 'true');
    }
    setSoundscapeIsPlaying(next);
    window.dispatchEvent(
      new CustomEvent('soundscape-play-pause-changed', {
        detail: { isPlaying: next, bootstrapSpaces: next },
      })
    );
    if (!next) {
      window.dispatchEvent(
        new CustomEvent('focus-volume-changed', { detail: { volume: 0, playbackOnly: true } })
      );
    } else {
      window.dispatchEvent(new CustomEvent('focus-spaces-resume'));
    }
  }, [userId, soundscapeIsPlaying]);

  const openSoundscapeComposer = useCallback(() => {
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('open-soundscape-composer'));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const loadHomeData = useCallback(async ({ silent = false } = {}) => {
    if (!userId) return;
    if (!silent) setHomeLoading(true);
    try {
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        setHomeLoading(false);
        return;
      }
      setSupabaseAuthToken(token);
      const supabase = getSupabaseClient();
      if (!supabase) {
        setHomeLoading(false);
        return;
      }
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 6);
      const weekStart = localStartOfDay(weekAgo);

      const [weekRes, tasksRes] = await Promise.all([
        supabase
          .from('focus_sessions')
          .select('completed_at, duration_seconds')
          .eq('user_id', userId)
          .eq('phase', 'session')
          .gte('completed_at', weekStart)
          .order('completed_at', { ascending: true }),
        supabase
          .from('tasks')
          .select('id, title, due_date, column_key')
          .eq('user_id', userId)
          .or('column_key.eq.todaysFocus,column_key.eq.inProgress')
          .is('completed_at', null)
          .order('due_date', { ascending: true })
          .limit(5),
      ]);

      const weekData = weekRes.data || [];
      const byDay = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekAgo);
        d.setDate(d.getDate() + i);
        byDay[localDateKey(d)] = 0;
      }
      weekData.forEach((row) => {
        const key = localDateKey(new Date(row.completed_at));
        if (byDay[key] !== undefined) byDay[key] += row.duration_seconds || 0;
      });
      const dayOrder = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekAgo);
        d.setDate(d.getDate() + i);
        dayOrder.push(d);
      }
      setWeeklyFocusSeconds(
        dayOrder.map((d) => ({
          key: localDateKey(d),
          label: DAY_LABELS[d.getDay() === 0 ? 6 : d.getDay() - 1],
          seconds: byDay[localDateKey(d)] || 0,
        }))
      );

      const tasks = (tasksRes.data || []).map((t) => ({
        id: t.id,
        title: t.title,
        due_date: t.due_date,
        column_key: t.column_key,
      }));
      setUpcomingTasks(tasks);
    } catch (e) {
      console.error('Home data load error:', e);
    } finally {
      setHomeLoading(false);
    }
  }, [userId, getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) {
      setHomeLoading(false);
      return;
    }
    loadHomeData();
  }, [isLoaded, isSignedIn, userId, loadHomeData]);

  useEffect(() => {
    const onSessionLogged = () => {
      void loadHomeData({ silent: true });
    };
    window.addEventListener('focus-session-logged', onSessionLogged);
    return () => window.removeEventListener('focus-session-logged', onSessionLogged);
  }, [loadHomeData]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    const id = setInterval(() => {
      void loadHomeData({ silent: true });
    }, 60_000);
    return () => clearInterval(id);
  }, [isLoaded, isSignedIn, userId, loadHomeData]);

  useEffect(() => {
    if (!hasConnection || workspaceSyncedRef.current) return;
    workspaceSyncedRef.current = true;
    void syncWorkspace().catch(() => {});
  }, [hasConnection, syncWorkspace]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    router.prefetch('/focus');
  }, [router]);

  const todayFormatted = typeof window !== 'undefined'
    ? new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    : '';
  const productiveSecondsToday = todayFocusSeconds;
  const goalSeconds = FOCUS_GOAL_MINUTES * 60;
  const focusPercent =
    goalSeconds > 0 ? Math.min(100, Math.round((productiveSecondsToday / goalSeconds) * 100)) : 0;
  const vsYesterday =
    yesterdayLoggedFocusSeconds > 0
      ? Math.round(((productiveSecondsToday - yesterdayLoggedFocusSeconds) / yesterdayLoggedFocusSeconds) * 100)
      : (productiveSecondsToday > 0 ? 100 : 0);
  const todayKey = typeof window !== 'undefined' ? localDateKey() : '';
  const weeklyFocusMinutes = useMemo(
    () =>
      weeklyFocusSeconds.map((d) => ({
        ...d,
        minutes: Math.round(
          (d.seconds + (d.key === todayKey ? unloggedFocusSeconds : 0)) / 60
        ),
      })),
    [weeklyFocusSeconds, unloggedFocusSeconds, todayKey]
  );
  const weekMax = Math.max(1, ...weeklyFocusMinutes.map((d) => d.minutes));
  const productivityPeakDay =
    weeklyFocusMinutes.length > 0
      ? weeklyFocusMinutes.reduce((best, d) => (d.minutes > best.minutes ? d : best), weeklyFocusMinutes[0])
      : null;
  const weekAvg =
    weeklyFocusMinutes.length > 0
      ? Math.round(
          weeklyFocusMinutes.reduce((a, d) => a + d.minutes, 0) / weeklyFocusMinutes.length
        )
      : 0;
  const productiveHours = Math.floor(productiveSecondsToday / 3600);
  const productiveMinutes = Math.floor((productiveSecondsToday % 3600) / 60);
  const productiveRemainderSeconds = productiveSecondsToday % 60;

  const workspaceAlertFeed = useMemo(() => {
    const items = [];

    if (inMeeting && currentMeeting) {
      items.push({
        key: 'meeting-now',
        kind: 'meeting-now',
        sortAt: Date.now(),
        meetingId: currentMeeting.id,
        title: currentMeeting.title || 'In meeting',
        when: currentMeeting.endsAt
          ? `Until ${new Date(currentMeeting.endsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
          : 'Happening now',
        isOnline: currentMeeting.isOnlineMeeting,
        meetUrl: currentMeeting.meetUrl,
        canJoin: currentMeeting.canJoin,
        href: currentMeeting.canJoin && currentMeeting.id ? `/meet/${currentMeeting.id}` : null,
      });
    }

    for (const m of upcomingMeetings) {
      items.push({
        key: m.id ? `cal-${m.id}` : `cal-${m.startsAt}-${m.title}`,
        kind: 'calendar',
        sortAt: new Date(m.startsAt).getTime(),
        meetingId: m.id,
        title: m.title || '(No title)',
        when: formatWorkspaceWhen(m.startsAt),
        isOnline: m.isOnlineMeeting,
        meetUrl: m.meetUrl,
        canJoin: m.canJoin,
        href: m.canJoin && m.id ? `/meet/${m.id}` : null,
      });
    }

    for (const n of workspaceNotifications) {
      if (n.is_read) continue;
      items.push({
        key: `mail-${n.id}`,
        kind: 'gmail',
        sortAt: new Date(n.received_at).getTime(),
        title: n.subject || '(No subject)',
        when: formatWorkspaceWhen(n.received_at),
        preview: n.preview,
        href: n.link_url,
      });
    }

    items.sort((a, b) => {
      if (a.kind === 'meeting-now') return -1;
      if (b.kind === 'meeting-now') return 1;
      if (a.kind === 'calendar' && b.kind === 'calendar') return a.sortAt - b.sortAt;
      if (a.kind === 'gmail' && b.kind === 'gmail') return b.sortAt - a.sortAt;
      if (a.kind === 'calendar' && b.kind === 'gmail') return -1;
      if (a.kind === 'gmail' && b.kind === 'calendar') return 1;
      return b.sortAt - a.sortAt;
    });

    return items.slice(0, 12);
  }, [inMeeting, currentMeeting, upcomingMeetings, workspaceNotifications]);

  const hasWorkspaceAlerts = workspaceAlertFeed.length > 0;
  const workspaceSyncMessage = formatWorkspaceSyncError(googleConnection?.sync_error);
  const showConnectPrompt = !workspaceLoading && !hasConnection;
  const showReconnectPrompt = !workspaceLoading && needsWorkspaceReconnect;
  const showSyncBanner = !workspaceLoading && hasConnection && Boolean(workspaceSyncMessage);

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#1A1A1A] px-4 pt-2 pb-4 sm:px-6 sm:pt-3 sm:pb-6 md:px-8 md:pt-4 md:pb-8 lg:px-12 lg:pt-6 lg:pb-10 font-[var(--font-poppins)]">
      <div className="max-w-7xl mx-auto">
        
        {/* --- Header Section --- */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 sm:mb-3 md:mb-4 gap-3 sm:gap-4">
          <div className="flex-1">
            <p className="text-indigo-500 text-xs font-semibold uppercase tracking-widest mb-2">Dashboard</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-2 leading-tight">
              Ready to flow, {displayName}?
            </h1>
            <p className="text-sm sm:text-base text-gray-500 font-medium">{todayFormatted || '—'}</p>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4 relative" ref={notificationsRef}>
            {inMeeting ? (
              currentMeeting?.canJoin && currentMeeting?.id ? (
                <Link
                  href={`/meet/${currentMeeting.id}`}
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-2 bg-amber-500 border border-amber-400 rounded-full text-white text-xs font-bold shadow-sm hover:bg-amber-600 transition-colors max-w-[220px]"
                >
                  <Video size={14} className="shrink-0" />
                  <span className="truncate">Join · {currentMeeting.title || 'Meeting'}</span>
                </Link>
              ) : (
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-full text-amber-800 text-xs font-semibold max-w-[200px] truncate">
                  <Video size={14} className="shrink-0" />
                  <span className="truncate">{currentMeeting?.title || 'In meeting'}</span>
                </div>
              )
            ) : null}
            <button
              type="button"
              onClick={() => setNotificationsOpen((o) => !o)}
              className={`relative p-2.5 sm:p-3 bg-white border rounded-full shadow-sm hover:shadow-md transition-all ${notificationsOpen ? 'border-indigo-200 text-indigo-600 ring-2 ring-indigo-100' : 'border-gray-100 text-gray-600'}`}
              aria-label="Notifications and quick actions"
            >
              <Bell size={18} className="sm:w-5 sm:h-5" />
              {unreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              ) : needsWorkspaceSync && !workspaceLoading ? (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-white animate-pulse" aria-hidden />
              ) : null}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notifications</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {workspaceLoading && !workspaceNotifications.length ? (
                    <div className="px-4 py-4 text-center text-gray-400 text-sm">Loading…</div>
                  ) : workspaceNotifications.length === 0 ? (
                    <div className="px-4 py-4 text-center text-gray-500 text-sm">
                      {needsWorkspaceSync && !workspaceLoading ? (
                        <button
                          type="button"
                          onClick={() => {
                            setNotificationsOpen(false);
                            openIntegrationsSettings();
                          }}
                          className="text-indigo-600 font-semibold hover:underline"
                        >
                          Sync Gmail & Calendar →
                        </button>
                      ) : (
                        "You're all caught up."
                      )}
                    </div>
                  ) : (
                    workspaceNotifications
                      .filter((n) => !n.is_read)
                      .slice(0, 8)
                      .map((n) => (
                      <a
                        key={n.id}
                        href={n.link_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setNotificationsOpen(false)}
                        className="flex gap-3 px-4 py-3 hover:bg-indigo-50 border-b border-gray-50 last:border-0"
                      >
                        <Mail size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{n.subject}</p>
                          <p className="text-xs text-gray-500 truncate">{n.preview}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {formatWorkspaceWhen(n.received_at)} · Gmail
                          </p>
                        </div>
                      </a>
                    ))
                  )}
                </div>
                <div className="border-t border-gray-100 px-2 pt-2">
                  <p className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick actions</p>
                  <Link
                    href="/tasks"
                    onClick={() => setNotificationsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-colors"
                  >
                    <ListChecks size={18} className="text-indigo-500 shrink-0" />
                    <span className="text-sm font-medium">View tasks</span>
                  </Link>
                  <Link
                    href="/focus"
                    onClick={() => setNotificationsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 transition-colors"
                  >
                    <Focus size={18} className="text-indigo-500 shrink-0" />
                    <span className="text-sm font-medium">Start focus session</span>
                  </Link>
                </div>
              </div>
            )}
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
              {/* Placeholder for user avatar */}
              <img 
                src={avatarUrl}
                alt="Profile" 
                className="h-full w-full object-cover" 
              />
            </div>
          </div>
        </header>


        {/* --- Main Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 md:gap-8 mb-5 sm:mb-6 md:mb-8">
          
          {/* 1. Focus Mode Hero Card (Spans 8 columns) */}
          <div className="lg:col-span-8 bg-gradient-to-br from-white via-indigo-50/20 to-purple-50/30 rounded-3xl sm:rounded-[40px] p-5 sm:p-6 md:p-8 lg:p-10 flex flex-col lg:flex-row relative overflow-hidden shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.2)] transition-all duration-300 border-2 border-indigo-100/60 group">
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-transparent to-purple-50/30 pointer-events-none opacity-100 group-hover:opacity-80 transition-opacity duration-500"></div>
            
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-bl-full blur-2xl"></div>
            
            <div className="flex-1 z-10 flex flex-col justify-center relative pr-0 lg:pr-6 xl:pr-8">
              {/* Enhanced badge */}
              <div className="inline-flex self-start items-center gap-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 px-4 sm:px-5 py-2 rounded-full text-[10px] sm:text-xs font-semibold tracking-wider mb-4 sm:mb-5 md:mb-6 shadow-sm border border-indigo-200/50">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                FOCUS MODE
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3 sm:mb-4 md:mb-5 text-gray-900 pr-0 lg:pr-4">
                Enter your flow state
              </h2>
              
              <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6 md:mb-8 max-w-md leading-relaxed font-medium pr-0 lg:pr-6">
                Start a focused work session tailored to your schedule and preferences.
              </p>
              
              {/* Enhanced CTA Button */}
              <button
                onClick={() => router.push('/focus')}
                className="bg-gradient-to-r from-[#545BE8] to-indigo-600 text-white px-7 sm:px-9 py-3 sm:py-3.5 md:py-4 rounded-xl sm:rounded-2xl flex items-center gap-3 font-medium hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-xl shadow-indigo-300/50 hover:shadow-2xl hover:shadow-indigo-400/50 w-full sm:w-fit text-sm sm:text-base hover:scale-105 active:scale-100 group/btn"
              >
                <div className="bg-white/25 p-1.5 rounded-full group-hover/btn:bg-white/30 transition-colors">
                  <Play size={14} className="sm:w-4 sm:h-4 fill-white ml-0.5" />
                </div>
                <span>Begin Focus Session</span>
                <ArrowUpRight size={16} className="opacity-70 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-all" />
              </button>
            </div>
            
            {/* Enhanced Decorative Image Container */}
            <div className="mt-4 sm:mt-6 lg:mt-0 lg:w-[300px] xl:w-[320px] lg:ml-4 h-40 sm:h-56 md:h-64 lg:h-auto rounded-2xl sm:rounded-[32px] overflow-hidden relative shadow-2xl shrink-0 group-hover:shadow-indigo-200/50 transition-shadow duration-300">
              {/* Image overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent z-10"></div>
              
              {/* Decorative border glow */}
              <div className="absolute inset-0 rounded-2xl sm:rounded-[32px] border-2 border-white/20 shadow-inner"></div>
              
              <img 
                src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=800" 
                alt="Mountain Landscape" 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              
              {/* Floating particles effect */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-white/60 rounded-full blur-sm animate-pulse"></div>
              <div className="absolute bottom-8 left-6 w-1.5 h-1.5 bg-indigo-300/60 rounded-full blur-sm animate-pulse" style={{ animationDelay: '0.5s' }}></div>
            </div>
          </div>

          {/* 2. Right Column Widgets (Spans 4 columns) */}
          <div className="lg:col-span-4 flex flex-col gap-5 sm:gap-6 md:gap-8">
            
            {/* Time Focused Card */}
            <div className="bg-gradient-to-br from-white to-indigo-50/30 p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-[32px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.2)] transition-all duration-300 border-2 border-indigo-100/60 flex flex-col justify-between group relative overflow-hidden">
              {/* Background decorative elements */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/20 rounded-full blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-purple-100/20 rounded-full blur-xl"></div>
              
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-t-2xl sm:rounded-t-[32px]"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2 sm:mb-3 md:mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 sm:p-2 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl shadow-sm border border-indigo-200/50">
                      <Timer size={14} className="sm:w-4 sm:h-4 text-indigo-600" />
                    </div>
                    <span className="text-gray-500 font-semibold text-[10px] sm:text-xs tracking-wider uppercase">Productive time</span>
                  </div>
                  <div className={`${vsYesterday >= 0 ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200/50' : 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200/50'} text-[9px] sm:text-[10px] font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm border`}>
                    <ArrowUpRight size={11} className={`sm:w-3.5 sm:h-3.5 ${vsYesterday < 0 ? 'rotate-180' : ''}`} />
                    <span className="font-bold">{vsYesterday >= 0 ? '+' : ''}{vsYesterday}%</span>
                    <span className="font-medium ml-0.5 hidden sm:inline shrink-0 text-[8px] opacity-80">vs yesterday</span>
                  </div>
                </div>
                
                <div className="mb-3 sm:mb-4 md:mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-none">{productiveHours}</span>
                    <span className="text-base sm:text-lg md:text-xl text-gray-500 font-medium">h</span>
                    <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-none ml-2">{productiveMinutes}</span>
                    <span className="text-base sm:text-lg md:text-xl text-gray-500 font-medium">m</span>
                    {isFocusTimerRunningToday && productiveRemainderSeconds > 0 ? (
                      <>
                        <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-none ml-2">{productiveRemainderSeconds}</span>
                        <span className="text-sm sm:text-base text-gray-500 font-medium">s</span>
                      </>
                    ) : null}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {isFocusTimerRunningToday
                      ? 'Focus timer running — updates live'
                      : productiveSecondsToday > 0
                        ? 'From focus timer sessions today'
                        : 'Start the focus timer to track productive time'}
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wide">Progress</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-bold text-gray-900">{focusPercent}%</span>
                      <span className="text-[10px] sm:text-xs text-gray-400 font-medium">of goal</span>
                    </div>
                  </div>
                  <div className="h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner relative">
                    <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full relative overflow-hidden shadow-sm transition-all duration-500" style={{ width: `${focusPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Soundscape Music Card */}
            <div className="bg-gradient-to-br from-[#2D2823] via-[#1F1B17] to-[#2D2823] text-white p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-[32px] relative overflow-hidden flex flex-col justify-between shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)] transition-shadow duration-300 border-2 border-gray-800/70 group">
               
               {/* Blurred Tokyo Background Image */}
               <div className="absolute inset-0 z-0">
                 <img 
                   src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&q=80&w=1200" 
                   alt="Tokyo" 
                   className="w-full h-full object-cover opacity-30 blur-md scale-110"
                 />
                 {/* Dark overlay for better text readability */}
                 <div className="absolute inset-0 bg-gradient-to-br from-[#2D2823]/90 via-[#1F1B17]/85 to-[#2D2823]/90"></div>
               </div>
               
               {/* Enhanced Background Blurs/Gradient */}
               <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/25 blur-3xl rounded-full animate-pulse z-10" />
               <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/25 blur-3xl rounded-full animate-pulse z-10" style={{ animationDelay: '1s' }} />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/15 blur-2xl rounded-full animate-pulse z-10" style={{ animationDelay: '0.5s' }} />
               {/* Additional gradient overlay */}
               <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-transparent to-indigo-900/10 pointer-events-none z-10"></div>

               <div className="flex justify-between items-start relative z-10 gap-2">
                 <div className="flex items-center gap-1.5 sm:gap-2 bg-white/15 backdrop-blur-md px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-semibold tracking-wider text-white shadow-lg border border-white/10">
                   <Music size={11} className="sm:w-3.5 sm:h-3.5" /> SOUNDSCAPE
                 </div>
                 <div className={`flex items-center gap-1.5 sm:gap-2 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-semibold shrink-0 shadow-lg border transition-colors ${
                   soundscapeIsPlaying 
                     ? 'bg-red-500/30 text-red-200 border-red-500/20' 
                     : 'bg-gray-500/30 text-gray-300 border-gray-500/20'
                 }`}>
                   <div className={`w-1.5 h-1.5 rounded-full shadow-sm transition-colors ${
                     soundscapeIsPlaying 
                       ? 'bg-red-400 animate-pulse shadow-red-400/50' 
                       : 'bg-gray-400'
                   }`} /> {soundscapeIsPlaying ? 'LIVE' : 'PAUSED'}
                 </div>
               </div>
               
               <div className="relative z-10 mt-3 sm:mt-4 md:mt-5">
                 <div className="flex items-end gap-1 sm:gap-1.5 mb-3 sm:mb-4 md:mb-5 h-6 sm:h-7 md:h-8 justify-center">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div 
                        key={i} 
                        className={`w-1.5 sm:w-2 bg-gradient-to-t from-indigo-400 via-purple-400 to-pink-400 rounded-full shadow-lg shadow-indigo-500/30 transition-opacity ${
                          soundscapeIsPlaying ? 'opacity-100' : 'opacity-50'
                        }`}
                        style={{
                          animationName: soundscapeIsPlaying ? 'dance' : 'none',
                          animationDuration: soundscapeIsPlaying ? `${0.7 + (i % 3) * 0.1}s` : '0s',
                          animationTimingFunction: 'ease-in-out',
                          animationIterationCount: soundscapeIsPlaying ? 'infinite' : '1',
                          animationDelay: `${i * 0.05}s`,
                          height: soundscapeIsPlaying ? `${60 + (i % 5) * 10}%` : '40%',
                          minHeight: '4px'
                        }}
                      />
                    ))}
                 </div>

                 <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-0.5">
                   {soundscapeActiveSounds.length > 0
                     ? soundscapeActiveSounds.map((s) => s.name).join(', ')
                     : 'No sounds in mix'}
                 </h3>
                 <p className="text-[10px] sm:text-xs text-gray-300 mb-3 sm:mb-4 md:mb-5 font-medium uppercase tracking-wide">
                   {spacesActive ? 'Spaces · On' : 'Spaces · Off'}
                   {soundscapeActiveSounds.length > 0 ? ' · Mix' : ' · Open Soundscape to add sounds'}
                 </p>
                 
                 <div className="flex items-center justify-between gap-2 flex-wrap">
                   <button
                     type="button"
                     onClick={openSoundscapeComposer}
                     className="text-[10px] sm:text-xs text-indigo-300 hover:text-white font-medium uppercase tracking-wide"
                   >
                     Open Soundscape
                   </button>
                   <div className="flex items-center gap-3 sm:gap-4">
                     <button 
                       onClick={toggleSoundscapePlayPause}
                       className="w-9 h-9 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center text-indigo-900 hover:scale-110 transition-transform shadow-lg hover:shadow-xl"
                       title={soundscapeIsPlaying ? 'Pause' : 'Play'}
                     >
                       {soundscapeIsPlaying ? (
                         <Pause size={18} className="sm:w-5 sm:h-5" fill="currentColor" />
                       ) : (
                         <Play size={18} className="sm:w-5 sm:h-5 ml-0.5" fill="currentColor" />
                       )}
                     </button>
                   </div>
                 </div>
               </div>
            </div>

          </div>
        </div>

        {/* --- Bottom Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 md:gap-8 pb-4 sm:pb-6 md:pb-8 lg:items-start">
          
          {/* Productivity Trend Graph — natural height; right card matches this on lg */}
          <div
            ref={productivityTrendRef}
            className="bg-gradient-to-br from-white to-indigo-50/30 p-5 sm:p-6 md:p-8 rounded-3xl sm:rounded-[40px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.2)] transition-all duration-300 border-2 border-indigo-100/60 flex flex-col justify-between group relative overflow-hidden"
          >
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/20 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-100/20 rounded-full blur-xl"></div>
            
            <div className="relative z-10 flex flex-col">
              <div className="flex justify-between items-start mb-4 sm:mb-5 md:mb-6 gap-4 shrink-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg shadow-sm border border-indigo-200/50">
                      <div className="w-2 h-2 bg-[#615FFF] rounded-full"></div>
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Productivity Trend</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Weekly focus efficiency</p>
                </div>
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 text-[#615FFF] px-3 sm:px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold shrink-0 shadow-sm border border-indigo-200/50 flex items-center gap-1.5">
                  <ArrowUpRight size={12} className="sm:w-3.5 sm:h-3.5" />
                  <span className="font-bold">+15%</span>
                </div>
              </div>
              
              {/* Enhanced SVG Chart - real weekly data */}
              <div className="relative h-40 sm:h-44 md:h-52 w-full mb-3 sm:mb-4">
                {homeLoading ? (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">Loading…</div>
                ) : (
                  <svg viewBox="0 0 400 150" className="w-full h-full">
                    <defs>
                      <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#615FFF" stopOpacity="0.25"/>
                        <stop offset="50%" stopColor="#818cf8" stopOpacity="0.15"/>
                        <stop offset="100%" stopColor="#615FFF" stopOpacity="0"/>
                      </linearGradient>
                      <linearGradient id="productivityLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#615FFF"/>
                        <stop offset="50%" stopColor="#818cf8"/>
                        <stop offset="100%" stopColor="#615FFF"/>
                      </linearGradient>
                    </defs>
                    {weeklyFocusMinutes.length > 0 ? (() => {
                      const pts = weeklyFocusMinutes.map((d, i) => ({
                        x: 50 + (i / Math.max(1, weeklyFocusMinutes.length - 1)) * 350,
                        y: 120 - (d.minutes / weekMax) * 90,
                      }));
                      const pathD = pts.length >= 2
                        ? `M${pts[0].x},${pts[0].y} ${pts.slice(1).map((p) => `L${p.x},${p.y}`).join(' ')} L${pts[pts.length - 1].x},120 L${pts[0].x},120 Z`
                        : '';
                      const lineD = pts.length >= 2 ? `M${pts.map((p) => `${p.x},${p.y}`).join(' L')}` : '';
                      return (
                        <>
                          <path d={pathD} fill="url(#productivityGradient)" />
                          <path d={lineD} fill="none" stroke="url(#productivityLine)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                          {pts.map((point, i) => (
                            <g key={i}>
                              <circle cx={point.x} cy={point.y} r="5" fill="white" stroke="#615FFF" strokeWidth="2.5"/>
                              <circle cx={point.x} cy={point.y} r="2.5" fill="#615FFF"/>
                            </g>
                          ))}
                        </>
                      );
                    })() : (
                      <text x="200" y="75" textAnchor="middle" className="text-gray-400" fill="currentColor" style={{ fontSize: 14 }}>No focus data this week</text>
                    )}
                  </svg>
                )}
              </div>
              
              <div className="flex justify-between mt-2 sm:mt-3 text-[9px] sm:text-[10px] text-gray-500 font-semibold uppercase tracking-wider px-1 sm:px-2">
                {weeklyFocusMinutes.length > 0
                  ? weeklyFocusMinutes.map((d) => <span key={d.key}>{d.label}</span>)
                  : DAY_LABELS.map((day) => <span key={day}>{day}</span>)}
              </div>
              
              <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-200/60 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center border border-indigo-100/50 shadow-sm">
                    <svg className="w-5 h-5 text-[#615FFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Peak Day</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">{productivityPeakDay?.label ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <div className="text-right">
                    <p className="text-[10px] sm:text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Avg (min/day)</p>
                    <p className="text-base sm:text-lg font-bold text-[#615FFF]">{weekAvg}m</p>
                  </div>
                  <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center border border-indigo-100/50 shadow-sm">
                    <svg className="w-5 h-5 text-[#615FFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming & Alerts — same height as Productivity Trend on lg; list scrolls inside */}
          <div
            className="bg-gradient-to-br from-white to-indigo-50/20 p-4 sm:p-5 md:p-6 rounded-3xl sm:rounded-[40px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.2)] transition-all duration-300 border-2 border-indigo-100/60 group relative overflow-hidden flex flex-col w-full"
            style={
              productivityTrendHeight
                ? { height: productivityTrendHeight, maxHeight: productivityTrendHeight }
                : undefined
            }
          >
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/20 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-100/20 rounded-full blur-xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col flex-1 min-h-0 h-full overflow-hidden">
             <div className="flex justify-between items-start mb-3 sm:mb-4 shrink-0 gap-4">
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg shadow-sm border border-indigo-200/50">
                      <Calendar size={14} className="sm:w-4 sm:h-4 text-indigo-600" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Upcoming & Alerts</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Your day at a glance</p>
               </div>
               <button
                 type="button"
                 onClick={openIntegrationsSettings}
                 className="shrink-0 inline-flex items-center justify-center rounded-full border border-indigo-200/90 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
               >
                 Integrations
               </button>
             </div>

             <div className="relative h-[11rem] sm:h-[12rem] md:h-[13rem] lg:h-auto lg:flex-1 lg:min-h-0">
               <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-none overscroll-contain px-0.5 py-2">
             <div className="space-y-2 sm:space-y-2.5">
                {showConnectPrompt ? (
                  <button
                    type="button"
                    onClick={openIntegrationsSettings}
                    className="w-full flex items-start gap-3 p-4 rounded-2xl border-2 border-indigo-200/90 bg-gradient-to-r from-indigo-50 to-violet-50/80 hover:border-indigo-300 hover:shadow-md transition-all group text-left"
                  >
                    <span className="relative flex h-3 w-3 shrink-0 mt-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-indigo-950">Sync Gmail & Calendar</p>
                      <p className="text-xs text-indigo-800/80 mt-0.5 leading-relaxed">
                        Connect Google to see meetings and unread mail here.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 shrink-0 group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </button>
                ) : null}

                {showReconnectPrompt ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border border-indigo-200/90 bg-indigo-50/60">
                    <p className="flex-1 text-xs sm:text-sm text-indigo-950 leading-relaxed">
                      Google connection expired. Reconnect to see meetings and mail here.
                    </p>
                    <button
                      type="button"
                      onClick={openIntegrationsSettings}
                      className="shrink-0 inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
                    >
                      Open integrations
                    </button>
                  </div>
                ) : null}

                {showSyncBanner ? (
                  <button
                    type="button"
                    onClick={openIntegrationsSettings}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-medium hover:bg-amber-100/80 transition-colors text-left"
                  >
                    <span className="shrink-0 w-2 h-2 rounded-full bg-amber-500" />
                    <span className="flex-1 truncate">{workspaceSyncMessage}</span>
                    <span className="shrink-0 font-semibold">Fix →</span>
                  </button>
                ) : null}

                {workspaceLoading && !hasWorkspaceAlerts ? (
                  <div className="py-6 text-center text-gray-400 text-sm">Loading Gmail & Calendar…</div>
                ) : null}

                {!workspaceLoading && hasWorkspaceAlerts ? (
                  <div className="space-y-2 sm:space-y-2.5">
                    {workspaceAlertFeed.map((alert) => {
                      const isNow = alert.kind === 'meeting-now';
                      const isCal = alert.kind === 'calendar';
                      const isMeeting = isNow || isCal;
                      const Icon = isNow ? Video : isCal ? Calendar : Mail;
                      const iconClass = isNow
                        ? 'text-amber-600 bg-amber-50 border-amber-200/60'
                        : isCal
                          ? 'text-indigo-600 bg-indigo-50 border-indigo-200/60'
                          : 'text-violet-600 bg-violet-50 border-violet-200/60';
                      const row = (
                        <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                          <div
                            className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl border shrink-0 ${iconClass}`}
                          >
                            <Icon size={18} className="sm:w-[18px] sm:h-[18px]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                              {isNow ? `Now · ${alert.title}` : alert.title}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-0.5 truncate">
                              {alert.when}
                              {isCal && alert.isOnline ? ' · Video call' : ''}
                              {alert.kind === 'gmail' ? ' · Gmail' : isCal ? ' · Calendar' : ''}
                            </p>
                            {alert.preview ? (
                              <p className="text-[10px] text-gray-400 mt-0.5 truncate">{alert.preview}</p>
                            ) : null}
                          </div>
                          {isMeeting && alert.canJoin ? (
                            <span className="shrink-0 rounded-full bg-[#615FFF] px-2.5 py-1 text-[10px] font-bold text-white shadow-sm">
                              Join
                            </span>
                          ) : !isNow && alert.href ? (
                            <ArrowUpRight size={14} className="text-gray-300 shrink-0 mt-1" />
                          ) : null}
                        </div>
                      );

                      const rowClassName = `flex p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all ${
                        isNow
                          ? 'border-amber-200/80 ring-1 ring-amber-100/50 bg-white/70 hover:bg-amber-50/40'
                          : 'border-gray-100/80 bg-white/70 hover:bg-indigo-50/40 hover:border-indigo-100'
                      }`;

                      if (alert.href?.startsWith('/')) {
                        return (
                          <Link key={alert.key} href={alert.href} className={rowClassName}>
                            {row}
                          </Link>
                        );
                      }

                      if (alert.href) {
                        return (
                          <a
                            key={alert.key}
                            href={alert.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={rowClassName}
                          >
                            {row}
                          </a>
                        );
                      }

                      return (
                        <div key={alert.key} className={rowClassName}>
                          {row}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {!workspaceLoading && hasConnection && !hasWorkspaceAlerts && !showConnectPrompt ? (
                  <div className="py-4 text-center text-gray-500 text-sm rounded-2xl border border-dashed border-gray-200/80 bg-white/40">
                    <p>No upcoming meetings or unread mail.</p>
                    <button
                      type="button"
                      onClick={openIntegrationsSettings}
                      className="text-indigo-600 font-medium hover:underline text-xs mt-1 inline-block"
                    >
                      Sync now →
                    </button>
                  </div>
                ) : null}

                {upcomingTasks.length > 0 ? (
                  <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-gray-400 pt-1">
                    Tasks
                  </p>
                ) : null}

                {homeLoading ? (
                  <div className="py-4 text-center text-gray-400 text-sm">Loading tasks…</div>
                ) : upcomingTasks.length === 0 && !hasWorkspaceAlerts && !showConnectPrompt && !workspaceLoading ? (
                  <div className="py-4 text-center text-gray-500 text-sm">
                    <p className="mb-2">No tasks in focus</p>
                    <Link href="/tasks" className="text-indigo-600 font-medium hover:underline inline-flex items-center gap-1">
                      <ListTodo size={14} /> Go to Tasks
                    </Link>
                  </div>
                ) : upcomingTasks.length > 0 ? (
                  upcomingTasks.map((task) => {
                    const due = task.due_date ? new Date(task.due_date) : null;
                    const isToday = due && due.toDateString() === new Date().toDateString();
                    const monthStr = due ? due.toLocaleDateString('en-US', { month: 'short' }) : '—';
                    const dayStr = due ? due.getDate() : '—';
                    const timeLabel = due
                      ? isToday
                        ? due.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                        : due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : 'No date';
                    return (
                      <Link
                        key={task.id}
                        href="/tasks"
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl group cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/30 transition-all duration-200 border border-transparent hover:border-indigo-100/50"
                      >
                        <div className="flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 group-hover:from-indigo-50 group-hover:to-purple-50 transition-all duration-200 shadow-sm shrink-0 border border-gray-200/50 group-hover:border-indigo-200/50">
                          <span className="text-[8px] sm:text-[9px] font-semibold text-gray-500 uppercase">{monthStr}</span>
                          <span className="text-base sm:text-lg font-semibold text-gray-800 group-hover:text-indigo-700">{dayStr}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-[#545BE8] transition-colors truncate">{task.title}</h4>
                          <p className="text-[10px] sm:text-[11px] text-gray-500 font-medium mt-0.5">{timeLabel}</p>
                        </div>
                        <div className="w-2.5 h-2.5 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full shrink-0 shadow-sm" />
                      </Link>
                    );
                  })
                ) : null}
                {!homeLoading && upcomingTasks.length > 0 && (
                  <Link
                    href="/tasks"
                    className="block text-center text-indigo-600 text-sm font-medium hover:underline py-2"
                  >
                    View all tasks →
                  </Link>
                )}
             </div>
               </div>
             </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}