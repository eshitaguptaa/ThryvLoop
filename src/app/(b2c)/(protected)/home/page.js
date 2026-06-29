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
import { useAppNotifications } from '@/hooks/useAppNotifications';
import { useSoundscapePlayback } from '@/hooks/useSoundscapePlayback';
import { formatWorkspaceSyncError } from '@/lib/workspace/userMessages';
import { useUser, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { getSupabaseClient, setSupabaseAuthToken, getUserStorageItem, setUserStorageItem } from '@/utils/userStorage';
import { localDateKey, localStartOfDay } from '@/lib/dateRanges';
import { getClerkSupabaseToken } from '@/lib/clerkSupabaseToken';
import { useTimer } from '@/contexts/TimerContext';
import { openIntegrationsSettings } from '@/lib/openFocusSettings';
import SpacesCrossfadeBackground from '@/components/landing_sections/SpacesCrossfadeBackground';
import ThemeToggle from '@/components/ThemeToggle';
import ProductivityTrendChart from '@/components/home/ProductivityTrendChart';
import {
  appSurfaceClass,
  appSurfaceInsetClass,
  appContentClass,
  appPageTitleClass,
  appEyebrowClass,
  appMutedTextClass,
  dashboardHeroCardClass,
  dashboardPanelClass,
  dashboardWidePanelClass,
  dashboardAlertsPanelClass,
  dashboardGlowOrbClass,
  dashboardGlowOrbSmClass,
  dashboardOverlayGradientClass,
  dashboardBadgeClass,
  dashboardIconChipClass,
  dashboardIconChipSmClass,
  dashboardStatBadgeClass,
  dashboardStatIconBoxClass,
} from '@/lib/appShellClasses';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

function AlertsSectionEmpty({ onSync }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4">
      <div className={`${dashboardIconChipSmClass} shrink-0`}>
        <Calendar size={14} className="text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">All clear for now</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          No upcoming meetings or unread important mail this week.
        </p>
        <button
          type="button"
          onClick={onSync}
          className="mt-2 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Sync calendar & mail →
        </button>
      </div>
    </div>
  );
}

function TasksSectionEmpty() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-dashed border-border bg-muted/30 p-4">
      <div className={`${dashboardIconChipSmClass} shrink-0`}>
        <ListTodo size={14} className="text-indigo-600 dark:text-indigo-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">No tasks in focus</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          Add tasks to Today&apos;s Focus or In Progress to see them here.
        </p>
        <Link
          href="/tasks"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
        >
          Open Tasks <ArrowUpRight size={12} />
        </Link>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { user } = useUser();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const userId = user?.id || null;
  const displayName = user?.firstName || user?.username || 'there';
  const avatarUrl = user?.imageUrl || 'https://i.pravatar.cc/150?u=default';

  const [weeklyFocusSeconds, setWeeklyFocusSeconds] = useState([]);
  const [priorWeekTotalSeconds, setPriorWeekTotalSeconds] = useState(0);
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
    needsGoogleResyncPrompt,
    googleResyncMessage,
    googleConnection,
    inMeeting,
    currentMeeting,
    upcomingMeetings,
    notifications: workspaceNotifications,
    sync: syncWorkspace,
    loading: workspaceLoading,
  } = useWorkspace({ enabled: Boolean(isSignedIn && userId) });

  const {
    notifications: appNotifications,
    unreadCount: appUnreadCount,
    loading: appNotificationsLoading,
    markRead: markAppNotificationRead,
  } = useAppNotifications({ enabled: Boolean(isSignedIn && userId) });

  const {
    displaySounds,
    composerSounds,
    showAsPlaying,
    spacesActive,
    togglePlayPause: toggleSoundscapePlayPause,
    openComposer: openSoundscapeComposer,
  } = useSoundscapePlayback(userId);

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
    if (!userId || !isSignedIn) return;
    if (!silent) setHomeLoading(true);
    try {
      const token = await getClerkSupabaseToken(getToken, isSignedIn);
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
      const twoWeeksAgo = new Date(now);
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13);
      const periodStart = localStartOfDay(twoWeeksAgo);

      const [weekRes, tasksRes] = await Promise.all([
        supabase
          .from('focus_sessions')
          .select('completed_at, duration_seconds')
          .eq('user_id', userId)
          .eq('phase', 'session')
          .gte('completed_at', periodStart)
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
      for (let i = 0; i < 14; i++) {
        const d = new Date(twoWeeksAgo);
        d.setDate(d.getDate() + i);
        byDay[localDateKey(d)] = 0;
      }
      weekData.forEach((row) => {
        const key = localDateKey(new Date(row.completed_at));
        if (byDay[key] !== undefined) byDay[key] += row.duration_seconds || 0;
      });

      let priorTotal = 0;
      for (let i = 0; i < 7; i++) {
        const d = new Date(twoWeeksAgo);
        d.setDate(d.getDate() + i);
        priorTotal += byDay[localDateKey(d)] || 0;
      }
      setPriorWeekTotalSeconds(priorTotal);

      const dayOrder = [];
      for (let i = 7; i < 14; i++) {
        const d = new Date(twoWeeksAgo);
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
  }, [userId, isSignedIn, getToken]);

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
  const productiveMinutesToday = Math.round(productiveSecondsToday / 60);
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

  const currentWeekTotalSeconds = useMemo(
    () =>
      weeklyFocusSeconds.reduce(
        (sum, d) => sum + d.seconds + (d.key === todayKey ? unloggedFocusSeconds : 0),
        0
      ),
    [weeklyFocusSeconds, unloggedFocusSeconds, todayKey]
  );
  const hasPriorWeekBaseline = priorWeekTotalSeconds > 0;
  const vsPriorWeek = hasPriorWeekBaseline
    ? Math.round(
        ((currentWeekTotalSeconds - priorWeekTotalSeconds) / priorWeekTotalSeconds) * 100
      )
    : currentWeekTotalSeconds > 0
      ? 100
      : 0;

  const focusPaceBenchmark = useMemo(() => {
    if (yesterdayLoggedFocusSeconds > 0) {
      return {
        targetSeconds: yesterdayLoggedFocusSeconds,
        targetMinutes: Math.round(yesterdayLoggedFocusSeconds / 60),
        shortLabel: 'yesterday',
        captionLabel: 'yesterday',
      };
    }
    if (weekAvg > 0) {
      return {
        targetSeconds: weekAvg * 60,
        targetMinutes: weekAvg,
        shortLabel: 'weekly avg',
        captionLabel: 'your weekly average',
      };
    }
    const peak = productivityPeakDay;
    if (peak && peak.key !== todayKey && peak.minutes > 0) {
      return {
        targetSeconds: peak.minutes * 60,
        targetMinutes: peak.minutes,
        shortLabel: peak.label,
        captionLabel: `${peak.label} (best this week)`,
      };
    }
    return null;
  }, [yesterdayLoggedFocusSeconds, weekAvg, productivityPeakDay, todayKey]);

  const focusPacePercent = focusPaceBenchmark
    ? Math.min(100, Math.round((productiveSecondsToday / focusPaceBenchmark.targetSeconds) * 100))
    : 0;
  const focusPaceAheadMinutes = focusPaceBenchmark
    ? Math.max(0, Math.round((productiveSecondsToday - focusPaceBenchmark.targetSeconds) / 60))
    : 0;
  const focusPaceRemainingMinutes = focusPaceBenchmark
    ? Math.max(0, focusPaceBenchmark.targetMinutes - productiveMinutesToday)
    : 0;
  const hasFocusPaceBaseline = focusPaceBenchmark != null;
  const hasYesterdayFocus = yesterdayLoggedFocusSeconds > 0;

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
      if (n.source !== 'gmail') continue;
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
  const showResyncPrompt = !workspaceLoading && hasConnection && needsGoogleResyncPrompt;
  const showSyncBanner = !workspaceLoading && hasConnection && Boolean(workspaceSyncMessage);

  return (
    <div className={`${appSurfaceClass} ${appSurfaceInsetClass} font-[var(--font-poppins)]`}>
      <div className={appContentClass}>
        
        {/* --- Header Section --- */}
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 sm:mb-3 md:mb-4 gap-3 sm:gap-4">
          <div className="flex-1">
            <p className={appEyebrowClass}>Dashboard</p>
            <h1 className={appPageTitleClass}>
              Ready to flow, {displayName}?
            </h1>
            <p className={`text-sm sm:text-base ${appMutedTextClass} font-medium`}>{todayFormatted || '—'}</p>
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
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 rounded-full text-amber-800 dark:text-amber-200 text-xs font-semibold max-w-[200px] truncate">
                  <Video size={14} className="shrink-0" />
                  <span className="truncate">{currentMeeting?.title || 'In meeting'}</span>
                </div>
              )
            ) : null}
            <ThemeToggle variant="compact" className="shrink-0" />
            <button
              type="button"
              onClick={() => setNotificationsOpen((o) => !o)}
              className={`relative p-2.5 sm:p-3 bg-card border rounded-full shadow-sm hover:shadow-md transition-all cursor-pointer ${notificationsOpen ? 'border-indigo-200 dark:border-indigo-500/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-100 dark:ring-indigo-500/25' : 'border-border text-muted-foreground'}`}
              aria-label="Notifications and quick actions"
            >
              <Bell size={18} className="sm:w-5 sm:h-5" />
              {appUnreadCount > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                  {appUnreadCount > 9 ? '9+' : appUnreadCount}
                </span>
              ) : needsGoogleResyncPrompt && !workspaceLoading ? (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-indigo-400 ring-2 ring-card" aria-hidden />
              ) : needsWorkspaceSync && !workspaceLoading ? (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-card animate-pulse" aria-hidden />
              ) : null}
            </button>
            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-card rounded-2xl shadow-xl border border-border py-2 z-50">
                <div className="px-4 py-2 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notifications</p>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {appNotificationsLoading && appNotifications.length === 0 ? (
                    <div className="px-4 py-4 text-center text-muted-foreground text-sm">Loading…</div>
                  ) : appNotifications.length === 0 ? (
                    <div className="px-4 py-4 text-center text-muted-foreground text-sm">
                      You&apos;re all caught up.
                    </div>
                  ) : (
                    appNotifications.slice(0, 8).map((n) => {
                      const content = (
                        <>
                          <Bell size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                            {n.body ? (
                              <p className="text-xs text-muted-foreground truncate">{n.body}</p>
                            ) : null}
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {formatWorkspaceWhen(n.created_at)}
                            </p>
                          </div>
                        </>
                      );
                      const className = `flex gap-3 px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border-b border-border last:border-0 ${!n.is_read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`;
                      const onOpen = () => {
                        if (!n.is_read) void markAppNotificationRead(n.id);
                        setNotificationsOpen(false);
                      };
                      if (n.link_url) {
                        const isExternal = /^https?:\/\//i.test(n.link_url);
                        return isExternal ? (
                          <a
                            key={n.id}
                            href={n.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={onOpen}
                            className={className}
                          >
                            {content}
                          </a>
                        ) : (
                          <Link key={n.id} href={n.link_url} onClick={onOpen} className={className}>
                            {content}
                          </Link>
                        );
                      }
                      return (
                        <button
                          key={n.id}
                          type="button"
                          onClick={onOpen}
                          className={`${className} w-full text-left cursor-pointer`}
                        >
                          {content}
                        </button>
                      );
                    })
                  )}
                </div>
                <div className="border-t border-border px-2 pt-2">
                  <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick actions</p>
                  <Link
                    href="/tasks"
                    onClick={() => setNotificationsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-foreground hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
                  >
                    <ListChecks size={18} className="text-indigo-500 shrink-0" />
                    <span className="text-sm font-medium">View tasks</span>
                  </Link>
                  <Link
                    href="/focus"
                    onClick={() => setNotificationsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-foreground hover:text-indigo-700 dark:hover:text-indigo-400 transition-colors"
                  >
                    <Focus size={18} className="text-indigo-500 shrink-0" />
                    <span className="text-sm font-medium">Start focus session</span>
                  </Link>
                </div>
              </div>
            )}
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full overflow-hidden border-2 border-card shadow-sm">
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
          <div className={dashboardHeroCardClass}>
            <div className={`absolute inset-0 ${dashboardOverlayGradientClass} pointer-events-none opacity-100 group-hover:opacity-80 transition-opacity duration-500`}></div>
            
            {/* Decorative corner accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 dark:from-indigo-500/5 dark:to-purple-500/5 rounded-bl-full blur-2xl"></div>
            
            <div className="flex-1 z-10 flex flex-col justify-center relative pr-0 lg:pr-6 xl:pr-8">
              {/* Enhanced badge */}
              <div className={`${dashboardBadgeClass} mb-4 sm:mb-5 md:mb-6`}>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>
                FOCUS MODE
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-3 sm:mb-4 md:mb-5 text-foreground pr-0 lg:pr-4">
                Enter your flow state
              </h2>
              
              <p className="text-sm sm:text-base text-muted-foreground mb-5 sm:mb-6 md:mb-8 max-w-md leading-relaxed font-medium pr-0 lg:pr-6">
                Start a focused work session tailored to your schedule and preferences.
              </p>
              
              {/* Enhanced CTA Button */}
              <button
                onClick={() => router.push('/focus')}
                className="bg-gradient-to-r from-[#545BE8] to-indigo-600 text-white px-7 sm:px-9 py-3 sm:py-3.5 md:py-4 rounded-xl sm:rounded-2xl flex items-center gap-3 font-medium hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-xl shadow-indigo-300/50 dark:shadow-indigo-900/40 hover:shadow-2xl hover:shadow-indigo-400/50 dark:hover:shadow-indigo-800/50 w-full sm:w-fit text-sm sm:text-base hover:scale-105 active:scale-100 group/btn cursor-pointer"
              >
                <div className="bg-white/20 p-1.5 rounded-full group-hover/btn:bg-white/30 transition-colors">
                  <Play size={14} className="sm:w-4 sm:h-4 fill-white ml-0.5" />
                </div>
                <span>Begin Focus Session</span>
                <ArrowUpRight size={16} className="opacity-70 group-hover/btn:opacity-100 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-all" />
              </button>
            </div>
            
            {/* Ambience spaces — crossfade (same stills as landing) */}
            <div className="mt-4 sm:mt-6 lg:mt-0 lg:w-[300px] xl:w-[320px] lg:ml-4 h-40 sm:h-56 md:h-64 lg:min-h-[280px] lg:h-full rounded-2xl sm:rounded-[32px] overflow-hidden relative shadow-2xl shrink-0 group-hover:shadow-indigo-200/50 dark:group-hover:shadow-indigo-900/40 transition-shadow duration-300">
              <SpacesCrossfadeBackground />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent z-10 pointer-events-none" />
              <div className="absolute top-4 right-4 w-2 h-2 bg-white/40 rounded-full blur-sm animate-pulse z-10" />
              <div className="absolute bottom-8 left-6 w-1.5 h-1.5 bg-indigo-300/60 rounded-full blur-sm animate-pulse z-10" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>

          {/* 2. Right Column Widgets (Spans 4 columns) */}
          <div className="lg:col-span-4 flex flex-col gap-5 sm:gap-6 md:gap-8">
            
            {/* Time Focused Card */}
            <div className={dashboardPanelClass}>
              <div className={`absolute top-0 right-0 w-24 h-24 ${dashboardGlowOrbClass} rounded-full blur-2xl`}></div>
              <div className={`absolute bottom-0 left-0 w-16 h-16 ${dashboardGlowOrbSmClass} rounded-full blur-xl`}></div>
              
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-t-2xl sm:rounded-t-[32px]"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-2 sm:mb-3 md:mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={dashboardIconChipClass}>
                      <Timer size={14} className="sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-muted-foreground font-semibold text-[10px] sm:text-xs tracking-wider uppercase">Productive time</span>
                  </div>
                  {hasYesterdayFocus ? (
                    <div className={`${vsYesterday >= 0 ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/45 dark:to-green-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-500/25' : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/45 dark:to-orange-950/30 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-500/25'} text-[9px] sm:text-[10px] font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl flex items-center gap-1.5 shrink-0 shadow-sm border`}>
                      <ArrowUpRight size={11} className={`sm:w-3.5 sm:h-3.5 ${vsYesterday < 0 ? 'rotate-180' : ''}`} />
                      <span className="font-bold">{vsYesterday >= 0 ? '+' : ''}{vsYesterday}%</span>
                      <span className="font-medium ml-0.5 hidden sm:inline shrink-0 text-[8px] opacity-80">vs yesterday</span>
                    </div>
                  ) : (
                    <div className="text-[9px] sm:text-[10px] font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl shrink-0 shadow-sm border bg-muted/50 text-muted-foreground border-border">
                      First day
                    </div>
                  )}
                </div>
                
                <div className="mb-3 sm:mb-4 md:mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-none">{productiveHours}</span>
                    <span className="text-base sm:text-lg md:text-xl text-muted-foreground font-medium">h</span>
                    <span className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-none ml-2">{productiveMinutes}</span>
                    <span className="text-base sm:text-lg md:text-xl text-muted-foreground font-medium">m</span>
                    {isFocusTimerRunningToday ? (
                      <>
                        <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-none ml-2">{productiveRemainderSeconds}</span>
                        <span className="text-sm sm:text-base text-muted-foreground font-medium">s</span>
                      </>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {isFocusTimerRunningToday
                      ? 'Focus timer running — updates live'
                      : productiveSecondsToday > 0
                        ? 'From focus timer sessions today'
                        : 'Start the focus timer to track productive time'}
                  </p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2 gap-2">
                    <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wide shrink-0">
                      Daily pace
                    </span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground font-medium text-right">
                      {hasFocusPaceBaseline ? (
                        focusPaceAheadMinutes > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Ahead of {focusPaceBenchmark.captionLabel} by {focusPaceAheadMinutes}m
                          </span>
                        ) : (
                          <>
                            <span className="font-bold text-foreground">{focusPacePercent}%</span>
                            {' · '}
                            {productiveMinutesToday}m of {focusPaceBenchmark.targetMinutes}m ({focusPaceBenchmark.shortLabel})
                          </>
                        )
                      ) : productiveSecondsToday > 0 ? (
                        <>{productiveMinutesToday}m logged today</>
                      ) : (
                        'Starts tomorrow'
                      )}
                    </span>
                  </div>
                  <div className="h-2.5 sm:h-3 bg-muted rounded-full overflow-hidden shadow-inner relative">
                    {hasFocusPaceBaseline ? (
                      <div
                        className={`h-full rounded-full relative overflow-hidden shadow-sm transition-all duration-500 ${
                          focusPaceAheadMinutes > 0
                            ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600'
                            : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600'
                        }`}
                        style={{ width: `${Math.max(focusPacePercent, productiveSecondsToday > 0 ? 4 : 0)}%` }}
                      />
                    ) : (
                      <div className="absolute inset-0 border border-dashed border-muted-foreground/25 rounded-full" />
                    )}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-2">
                    {hasFocusPaceBaseline ? (
                      focusPaceAheadMinutes > 0
                        ? `${productiveMinutesToday}m focused today — past ${focusPaceBenchmark.captionLabel}`
                        : focusPaceRemainingMinutes > 0
                          ? `${focusPaceRemainingMinutes}m to match ${focusPaceBenchmark.captionLabel}`
                          : productiveSecondsToday > 0
                            ? `Matched ${focusPaceBenchmark.captionLabel} for today`
                            : `Start the focus timer to build toward ${focusPaceBenchmark.captionLabel}`
                    ) : productiveSecondsToday > 0
                      ? `${productiveMinutesToday}m focused today — pace vs yesterday begins tomorrow`
                      : 'No history to compare yet. Focus today and this bar tracks your pace from tomorrow.'}
                  </p>
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
                 <div className="flex items-center gap-1.5 sm:gap-2 bg-card/15 backdrop-blur-md px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[9px] sm:text-[10px] font-semibold tracking-wider text-white shadow-lg border border-white/10">
                   <Music size={11} className="sm:w-3.5 sm:h-3.5" /> SOUNDSCAPE
                 </div>
                 <div className={`flex items-center gap-1.5 sm:gap-2 backdrop-blur-sm px-2.5 sm:px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-semibold shrink-0 shadow-lg border transition-colors ${
                   showAsPlaying 
                     ? 'bg-red-500/30 text-red-200 border-red-500/20' 
                     : 'bg-gray-500/30 text-gray-300 border-gray-500/20'
                 }`}>
                   <div className={`w-1.5 h-1.5 rounded-full shadow-sm transition-colors ${
                     showAsPlaying 
                       ? 'bg-red-400 animate-pulse shadow-red-400/50' 
                       : 'bg-gray-400'
                   }`} /> {showAsPlaying ? 'LIVE' : 'PAUSED'}
                 </div>
               </div>
               
               <div className="relative z-10 mt-3 sm:mt-4 md:mt-5">
                 <div className="flex items-end gap-1 sm:gap-1.5 mb-3 sm:mb-4 md:mb-5 h-6 sm:h-7 md:h-8 justify-center">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                      <div 
                        key={i} 
                        className={`w-1.5 sm:w-2 bg-gradient-to-t from-indigo-400 via-purple-400 to-pink-400 rounded-full shadow-lg shadow-indigo-500/30 transition-opacity ${
                          showAsPlaying ? 'opacity-100' : 'opacity-50'
                        }`}
                        style={{
                          animationName: showAsPlaying ? 'dance' : 'none',
                          animationDuration: showAsPlaying ? `${0.7 + (i % 3) * 0.1}s` : '0s',
                          animationTimingFunction: 'ease-in-out',
                          animationIterationCount: showAsPlaying ? 'infinite' : '1',
                          animationDelay: `${i * 0.05}s`,
                          height: showAsPlaying ? `${60 + (i % 5) * 10}%` : '40%',
                          minHeight: '4px'
                        }}
                      />
                    ))}
                 </div>

                 <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-0.5">
                   {displaySounds.length > 0
                     ? displaySounds.map((s) => s.name).join(', ')
                     : showAsPlaying
                       ? 'Spaces'
                       : 'No sounds in mix'}
                 </h3>
                 <p className="text-[10px] sm:text-xs text-gray-300 mb-3 sm:mb-4 md:mb-5 font-medium uppercase tracking-wide">
                   {spacesActive ? 'Spaces · On' : 'Spaces · Off'}
                   {composerSounds.length > 0 ? ' · Mix' : !showAsPlaying ? ' · Open Soundscape to add sounds' : ''}
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
                       className="w-9 h-9 sm:w-10 sm:h-10 bg-white/90 rounded-full flex items-center justify-center text-indigo-900 hover:scale-110 transition-transform shadow-lg hover:shadow-xl cursor-pointer"
                       title={showAsPlaying ? 'Pause' : 'Play'}
                     >
                       {showAsPlaying ? (
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
            className={dashboardWidePanelClass}
          >
            {/* Background decorative elements */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${dashboardGlowOrbClass} rounded-full blur-2xl`}></div>
            <div className={`absolute bottom-0 left-0 w-24 h-24 ${dashboardGlowOrbSmClass} rounded-full blur-xl`}></div>
            
            <div className="relative z-10 flex flex-col">
              <div className="flex justify-between items-start mb-4 sm:mb-5 md:mb-6 gap-4 shrink-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={dashboardIconChipSmClass}>
                      <div className="w-2 h-2 bg-[#615FFF] rounded-full"></div>
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-foreground">Productivity Trend</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-1">Weekly focus efficiency</p>
                </div>
                {homeLoading ? (
                  <div className={`${dashboardStatBadgeClass} opacity-60`}>
                    <span className="font-bold">…</span>
                  </div>
                ) : hasPriorWeekBaseline || currentWeekTotalSeconds > 0 ? (
                  <div
                    className={`${
                      vsPriorWeek >= 0
                        ? 'bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/45 dark:to-green-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/50 dark:border-emerald-500/25'
                        : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/45 dark:to-orange-950/30 text-amber-700 dark:text-amber-300 border-amber-200/50 dark:border-amber-500/25'
                    } text-[10px] sm:text-xs font-semibold px-3 sm:px-3.5 py-1.5 rounded-full shrink-0 shadow-sm border flex items-center gap-1.5`}
                  >
                    <ArrowUpRight
                      size={12}
                      className={`sm:w-3.5 sm:h-3.5 ${vsPriorWeek < 0 ? 'rotate-180' : ''}`}
                    />
                    <span className="font-bold">
                      {vsPriorWeek >= 0 ? '+' : ''}
                      {vsPriorWeek}%
                    </span>
                    <span className="font-medium hidden sm:inline text-[9px] opacity-80">vs prior week</span>
                  </div>
                ) : (
                  <div className="text-[10px] sm:text-xs font-semibold px-3 sm:px-3.5 py-1.5 rounded-full shrink-0 shadow-sm border bg-muted/50 text-muted-foreground border-border">
                    First week
                  </div>
                )}
              </div>
              
              {/* Enhanced SVG Chart - real weekly data */}
              <ProductivityTrendChart
                data={weeklyFocusMinutes}
                peakDay={productivityPeakDay}
                todayKey={todayKey}
                loading={homeLoading}
              />
              
              <div className="flex justify-between mt-2 sm:mt-3 text-[9px] sm:text-[10px] text-muted-foreground font-semibold uppercase tracking-wider px-1 sm:px-2">
                {weeklyFocusMinutes.length > 0
                  ? weeklyFocusMinutes.map((d) => <span key={d.key}>{d.label}</span>)
                  : DAY_LABELS.map((day) => <span key={day}>{day}</span>)}
              </div>
              
              <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className={dashboardStatIconBoxClass}>
                    <svg className="w-5 h-5 text-[#615FFF] dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Peak Day</p>
                    <p className="text-sm sm:text-base font-semibold text-foreground">{productivityPeakDay?.label ?? '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <div className="text-right">
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Avg (min/day)</p>
                    <p className="text-base sm:text-lg font-bold text-[#615FFF] dark:text-indigo-400">{weekAvg}m</p>
                  </div>
                  <div className={dashboardStatIconBoxClass}>
                    <svg className="w-5 h-5 text-[#615FFF] dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming & Alerts — same height as Productivity Trend on lg; list scrolls inside */}
          <div
            className={`${dashboardAlertsPanelClass} group relative overflow-hidden flex flex-col w-full`}
            style={
              productivityTrendHeight
                ? { height: productivityTrendHeight, maxHeight: productivityTrendHeight }
                : undefined
            }
          >
            {/* Background decorative elements */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${dashboardGlowOrbClass} rounded-full blur-2xl pointer-events-none`}></div>
            <div className={`absolute bottom-0 left-0 w-24 h-24 ${dashboardGlowOrbSmClass} rounded-full blur-xl pointer-events-none`}></div>
            
            <div className="relative z-10 flex flex-col flex-1 min-h-0 h-full overflow-hidden">
             <div className="flex justify-between items-start mb-3 sm:mb-4 shrink-0 gap-4">
               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={dashboardIconChipSmClass}>
                      <Calendar size={14} className="sm:w-4 sm:h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-semibold text-foreground">Upcoming & Alerts</h3>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium mt-2">Your day at a glance</p>
               </div>
               <button
                 type="button"
                 onClick={openIntegrationsSettings}
                 className="shrink-0 inline-flex items-center justify-center rounded-full border border-indigo-200/90 dark:border-indigo-500/30 bg-card px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 shadow-sm hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-colors cursor-pointer"
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
                    className="w-full flex items-start gap-3 p-4 rounded-2xl border-2 border-indigo-200/90 dark:border-indigo-500/30 bg-gradient-to-r from-indigo-50 to-violet-50/80 dark:from-indigo-950/40 dark:to-violet-950/30 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md transition-all group text-left cursor-pointer"
                  >
                    <span className="relative flex h-3 w-3 shrink-0 mt-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-indigo-950 dark:text-indigo-200">Sync Gmail & Calendar</p>
                      <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 mt-0.5 leading-relaxed">
                        Connect Google to see meetings and unread important mail here.
                      </p>
                    </div>
                    <span className="text-xs font-bold text-indigo-600 shrink-0 group-hover:translate-x-0.5 transition-transform">
                      →
                    </span>
                  </button>
                ) : null}

                {showResyncPrompt ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border border-indigo-200/90 dark:border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-950/35">
                    <p className="flex-1 text-xs sm:text-sm text-indigo-950 dark:text-indigo-200 leading-relaxed">
                      {googleResyncMessage}
                    </p>
                    <button
                      type="button"
                      onClick={openIntegrationsSettings}
                      className="shrink-0 inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
                    >
                      Resync Google
                    </button>
                  </div>
                ) : null}

                {showReconnectPrompt ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-2xl border border-indigo-200/90 dark:border-indigo-500/30 bg-indigo-50/60 dark:bg-indigo-950/35">
                    <p className="flex-1 text-xs sm:text-sm text-indigo-950 dark:text-indigo-200 leading-relaxed">
                      Google needs a quick resync to refresh Calendar and Gmail.
                    </p>
                    <button
                      type="button"
                      onClick={openIntegrationsSettings}
                      className="shrink-0 inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
                    >
                      Resync Google
                    </button>
                  </div>
                ) : null}

                {showSyncBanner ? (
                  <button
                    type="button"
                    onClick={openIntegrationsSettings}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/35 border border-amber-200/80 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-medium hover:bg-amber-100/80 dark:hover:bg-amber-950/50 transition-colors text-left cursor-pointer"
                  >
                    <span className="shrink-0 w-2 h-2 rounded-full bg-amber-500" />
                    <span className="flex-1 truncate">{workspaceSyncMessage}</span>
                    <span className="shrink-0 font-semibold">Fix →</span>
                  </button>
                ) : null}

                {workspaceLoading && !hasWorkspaceAlerts && hasConnection ? (
                  <div className="py-5 text-center text-sm text-muted-foreground">Loading Gmail & Calendar…</div>
                ) : null}

                {!workspaceLoading && hasConnection && !hasWorkspaceAlerts ? (
                  <AlertsSectionEmpty onSync={openIntegrationsSettings} />
                ) : null}

                {!workspaceLoading && hasWorkspaceAlerts ? (
                  <div className="space-y-2 sm:space-y-2.5">
                    {workspaceAlertFeed.map((alert) => {
                      const isNow = alert.kind === 'meeting-now';
                      const isCal = alert.kind === 'calendar';
                      const isMeeting = isNow || isCal;
                      const Icon = isNow ? Video : isCal ? Calendar : Mail;
                      const iconClass = isNow
                        ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-500/30'
                        : isCal
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-500/30'
                          : 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-200/60 dark:border-violet-500/30';
                      const row = (
                        <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                          <div
                            className={`flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl border shrink-0 ${iconClass}`}
                          >
                            <Icon size={18} className="sm:w-[18px] sm:h-[18px]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                              {isNow ? `Now · ${alert.title}` : alert.title}
                            </p>
                            <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium mt-0.5 truncate">
                              {alert.when}
                              {isCal && alert.isOnline ? ' · Video call' : ''}
                              {alert.kind === 'gmail' ? ' · Important' : isCal ? ' · Calendar' : ''}
                            </p>
                            {alert.preview ? (
                              <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{alert.preview}</p>
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
                          ? 'border-amber-200/80 dark:border-amber-500/30 ring-1 ring-amber-100/50 dark:ring-amber-500/20 bg-card hover:bg-amber-50/40 dark:hover:bg-amber-950/25'
                          : 'border-border bg-card hover:bg-indigo-50/40 dark:hover:bg-indigo-950/25 hover:border-indigo-100 dark:hover:border-indigo-500/25'
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

                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground pt-2 sm:pt-3">
                  Tasks
                </p>

                {homeLoading ? (
                  <div className="py-5 text-center text-sm text-muted-foreground">Loading tasks…</div>
                ) : upcomingTasks.length > 0 ? (
                  <div className="space-y-2 sm:space-y-2.5">
                  {upcomingTasks.map((task) => {
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
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-3.5 rounded-xl sm:rounded-2xl group cursor-pointer hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/30 dark:hover:from-indigo-950/30 dark:hover:to-purple-950/20 transition-all duration-200 border border-transparent hover:border-indigo-100/50 dark:hover:border-indigo-500/25"
                      >
                        <div className="flex flex-col items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-muted dark:to-muted/80 group-hover:from-indigo-50 group-hover:to-purple-50 dark:group-hover:from-indigo-950/40 dark:group-hover:to-purple-950/30 transition-all duration-200 shadow-sm shrink-0 border border-border group-hover:border-indigo-200/50 dark:group-hover:border-indigo-500/30">
                          <span className="text-[8px] sm:text-[9px] font-semibold text-muted-foreground uppercase">{monthStr}</span>
                          <span className="text-base sm:text-lg font-semibold text-foreground group-hover:text-indigo-700 dark:group-hover:text-indigo-400">{dayStr}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-[#545BE8] transition-colors truncate">{task.title}</h4>
                          <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium mt-0.5">{timeLabel}</p>
                        </div>
                        <div className="w-2.5 h-2.5 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full shrink-0 shadow-sm" />
                      </Link>
                    );
                  })}
                  <Link
                    href="/tasks"
                    className="block py-2 text-center text-sm font-medium text-indigo-600 hover:underline"
                  >
                    View all tasks →
                  </Link>
                  </div>
                ) : (
                  <TasksSectionEmpty />
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