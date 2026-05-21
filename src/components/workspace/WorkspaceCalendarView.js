'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Video,
  Clock,
} from 'lucide-react';
import { workspaceApiFetch } from '@/lib/workspace/clientApi';

const HOUR_START = 6;
const HOUR_END = 22;
const HOUR_HEIGHT = 56;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function startOfWeek(d) {
  const x = startOfDay(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(x, diff);
}

function endOfWeek(weekStart) {
  return addDays(weekStart, 7);
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatMonthYear(d) {
  return d.toLocaleDateString([], { month: 'long', year: 'numeric' });
}

function formatWeekRange(weekStart) {
  const end = addDays(weekStart, 6);
  const opts = { month: 'short', day: 'numeric' };
  if (weekStart.getMonth() === end.getMonth()) {
    return `${weekStart.toLocaleDateString([], opts)} – ${end.getDate()}, ${end.getFullYear()}`;
  }
  return `${weekStart.toLocaleDateString([], opts)} – ${end.toLocaleDateString([], opts)}`;
}

function eventMinutesFromMidnight(iso) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export default function WorkspaceCalendarView() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [events, setEvents] = useState([]);
  const [hasConnection, setHasConnection] = useState(false);
  const [accountEmail, setAccountEmail] = useState(null);
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  const monthGrid = useMemo(() => {
    const anchor = new Date(selectedDay.getFullYear(), selectedDay.getMonth(), 1);
    const gridStart = startOfWeek(anchor);
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [selectedDay]);

  const fetchCalendar = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const rangeStart = weekStart;
    const rangeEnd = endOfWeek(weekStart);
    try {
      const res = await workspaceApiFetch(
        `/api/workspace/calendar?start=${encodeURIComponent(rangeStart.toISOString())}&end=${encodeURIComponent(rangeEnd.toISOString())}`,
        {},
        getToken
      );
      const json = await res.json();
      if (res.status === 401) {
        throw new Error('Sign in again to view your calendar.');
      }
      if (!res.ok) throw new Error(json.error || 'Failed to load calendar');
      setEvents(json.events || []);
      setHasConnection(Boolean(json.hasConnection));
      setAccountEmail(json.googleConnection?.account_email ?? null);
      setLastSyncedAt(json.googleConnection?.last_synced_at ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load calendar');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [isLoaded, isSignedIn, weekStart, getToken]);

  useEffect(() => {
    void fetchCalendar();
  }, [fetchCalendar]);

  const syncNow = async () => {
    setSyncing(true);
    try {
      const res = await workspaceApiFetch('/api/workspace/sync', { method: 'POST' }, getToken);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Sync failed');
      await fetchCalendar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const goToday = () => {
    const today = startOfDay(new Date());
    setWeekStart(startOfWeek(today));
    setSelectedDay(today);
  };

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const day of weekDays) {
      map.set(day.toDateString(), []);
    }
    for (const ev of events) {
      const start = new Date(ev.startsAt);
      const key = startOfDay(start).toDateString();
      if (map.has(key)) map.get(key).push(ev);
    }
    return map;
  }, [events, weekDays]);

  const selectedDayEvents = useMemo(() => {
    const list = eventsByDay.get(selectedDay.toDateString()) || [];
    return [...list].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  }, [eventsByDay, selectedDay]);

  const now = new Date();
  const nowMinutes = eventMinutesFromMidnight(now);
  const gridHeight = (HOUR_END - HOUR_START) * HOUR_HEIGHT;

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#1A1A1A] px-4 pt-2 pb-8 sm:px-6 sm:pt-4 md:px-8 lg:px-12 font-(--font-poppins)">
      <div className="max-w-[1600px] mx-auto">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <p className="text-indigo-500 text-xs font-semibold uppercase tracking-widest mb-2">Schedule</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">Calendar</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              {hasConnection && accountEmail
                ? `Synced from ${accountEmail}`
                : 'Connect Google to see your calendar here'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={goToday}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
            >
              Today
            </button>
            <div className="flex items-center rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setWeekStart((w) => addDays(w, -7))}
                className="p-2.5 hover:bg-gray-50 text-gray-600 transition-colors"
                aria-label="Previous week"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-3 sm:px-4 text-sm font-semibold text-gray-800 min-w-[10rem] text-center">
                {formatWeekRange(weekStart)}
              </span>
              <button
                type="button"
                onClick={() => setWeekStart((w) => addDays(w, 7))}
                className="p-2.5 hover:bg-gray-50 text-gray-600 transition-colors"
                aria-label="Next week"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            {hasConnection ? (
              <button
                type="button"
                onClick={syncNow}
                disabled={syncing || loading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 shadow-sm transition-colors"
              >
                {syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                Sync
              </button>
            ) : (
              <Link
                href="/settings/integrations"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 shadow-sm transition-colors"
              >
                Connect Google
              </Link>
            )}
          </div>
        </header>

        {error ? (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {!hasConnection && !loading ? (
          <div className="rounded-3xl border-2 border-dashed border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white p-10 sm:p-14 text-center shadow-sm">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 mb-4">
              <Calendar size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Connect your Google Calendar</h2>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto leading-relaxed">
              See your meetings week-by-week, join Google Meet calls, and keep ThryvLoop in sync with your schedule.
            </p>
            <Link
              href="/settings/integrations"
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition-colors"
            >
              Open integrations
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[240px_1fr_300px] gap-5 sm:gap-6">
            {/* Mini month */}
            <aside className="bg-white rounded-3xl border border-gray-100/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-4 sm:p-5 h-fit">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-gray-900">{formatMonthYear(selectedDay)}</p>
                <div className="flex gap-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDay((d) => new Date(d.getFullYear(), d.getMonth() - 1, d.getDate()))
                    }
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                    aria-label="Previous month"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedDay((d) => new Date(d.getFullYear(), d.getMonth() + 1, d.getDate()))
                    }
                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
                    aria-label="Next month"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-[10px] font-semibold text-gray-400 uppercase mb-1">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((l) => (
                  <span key={l} className="text-center py-1">
                    {l}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {monthGrid.map((day) => {
                  const inMonth = day.getMonth() === selectedDay.getMonth();
                  const selected = isSameDay(day, selectedDay);
                  const isToday = isSameDay(day, now);
                  const hasEvents = (eventsByDay.get(day.toDateString()) || []).length > 0;
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => {
                        setSelectedDay(startOfDay(day));
                        setWeekStart(startOfWeek(day));
                      }}
                      className={`relative aspect-square rounded-lg text-xs font-semibold transition-colors ${
                        selected
                          ? 'bg-[#615FFF] text-white shadow-md'
                          : inMonth
                            ? 'text-gray-800 hover:bg-indigo-50'
                            : 'text-gray-300 hover:bg-gray-50'
                      } ${isToday && !selected ? 'ring-2 ring-indigo-300 ring-offset-1' : ''}`}
                    >
                      {day.getDate()}
                      {hasEvents && !selected ? (
                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              {lastSyncedAt ? (
                <p className="text-[10px] text-gray-400 mt-4 text-center">
                  Last sync {new Date(lastSyncedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              ) : null}
            </aside>

            {/* Week grid */}
            <section className="bg-white rounded-3xl border border-gray-100/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] overflow-hidden min-h-[480px]">
              {loading ? (
                <div className="flex items-center justify-center py-32 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-gray-100 bg-gradient-to-r from-slate-50/80 to-white">
                    <div className="border-r border-gray-100" />
                    {weekDays.map((day) => {
                      const isToday = isSameDay(day, now);
                      const selected = isSameDay(day, selectedDay);
                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          onClick={() => setSelectedDay(startOfDay(day))}
                          className={`py-3 px-1 text-center border-r border-gray-100 last:border-r-0 transition-colors ${
                            selected ? 'bg-indigo-50/80' : 'hover:bg-gray-50/80'
                          }`}
                        >
                          <p className="text-[10px] font-semibold uppercase text-gray-400">
                            {day.toLocaleDateString([], { weekday: 'short' })}
                          </p>
                          <p
                            className={`text-lg font-bold mt-0.5 tabular-nums ${
                              isToday ? 'text-[#615FFF]' : 'text-gray-900'
                            }`}
                          >
                            {day.getDate()}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-[52px_repeat(7,1fr)] overflow-x-auto">
                    <div className="border-r border-gray-100 relative" style={{ height: gridHeight }}>
                      {HOURS.map((h) => (
                        <div
                          key={h}
                          className="absolute left-0 right-0 text-[10px] text-gray-400 font-medium pr-2 text-right -translate-y-1/2"
                          style={{ top: (h - HOUR_START) * HOUR_HEIGHT }}
                        >
                          {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
                        </div>
                      ))}
                    </div>

                    {weekDays.map((day) => {
                      const dayEvents = eventsByDay.get(day.toDateString()) || [];
                      const isToday = isSameDay(day, now);
                      const showNowLine =
                        isToday && nowMinutes >= HOUR_START * 60 && nowMinutes <= HOUR_END * 60;

                      return (
                        <div
                          key={day.toISOString()}
                          className={`relative border-r border-gray-100 last:border-r-0 ${
                            isSameDay(day, selectedDay) ? 'bg-indigo-50/20' : ''
                          }`}
                          style={{ height: gridHeight }}
                        >
                          {HOURS.map((h) => (
                            <div
                              key={h}
                              className="absolute left-0 right-0 border-t border-gray-100/80"
                              style={{ top: (h - HOUR_START) * HOUR_HEIGHT }}
                            />
                          ))}

                          {showNowLine ? (
                            <div
                              className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                              style={{
                                top:
                                  ((nowMinutes - HOUR_START * 60) / ((HOUR_END - HOUR_START) * 60)) *
                                  gridHeight,
                              }}
                            >
                              <span className="w-2 h-2 rounded-full bg-rose-500 -ml-1 shrink-0" />
                              <span className="flex-1 h-0.5 bg-rose-500/80" />
                            </div>
                          ) : null}

                          {dayEvents.map((ev) => {
                            const startMin = eventMinutesFromMidnight(ev.startsAt);
                            const endMin = eventMinutesFromMidnight(ev.endsAt);
                            const clampStart = Math.max(startMin, HOUR_START * 60);
                            const clampEnd = Math.min(endMin, (HOUR_END + 1) * 60);
                            if (clampEnd <= clampStart) return null;
                            const top =
                              ((clampStart - HOUR_START * 60) / ((HOUR_END - HOUR_START) * 60)) *
                              gridHeight;
                            const height = Math.max(
                              ((clampEnd - clampStart) / ((HOUR_END - HOUR_START) * 60)) * gridHeight,
                              28
                            );
                            const isFree = ev.showAs === 'free';
                            const isLive =
                              new Date(ev.startsAt) <= now && new Date(ev.endsAt) > now;

                            return (
                              <button
                                key={ev.id}
                                type="button"
                                onClick={() => setSelectedDay(startOfDay(new Date(ev.startsAt)))}
                                className={`absolute left-0.5 right-0.5 z-10 rounded-lg px-1.5 py-1 text-left overflow-hidden border transition-shadow hover:shadow-md ${
                                  isFree
                                    ? 'bg-gray-50/90 border-gray-200/80 border-dashed text-gray-600'
                                    : isLive
                                      ? 'bg-gradient-to-br from-amber-100 to-orange-50 border-amber-300/80 text-amber-950 ring-1 ring-amber-200/60'
                                      : 'bg-gradient-to-br from-indigo-100 to-violet-50 border-indigo-200/70 text-indigo-950'
                                }`}
                                style={{ top, height }}
                              >
                                <p className="text-[10px] font-bold truncate leading-tight">{ev.title}</p>
                                <p className="text-[9px] opacity-80 truncate">
                                  {formatTime(ev.startsAt)}
                                </p>
                                {ev.isOnlineMeeting ? (
                                  <Video size={10} className="mt-0.5 opacity-70" />
                                ) : null}
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>

            {/* Day agenda */}
            <aside className="bg-white rounded-3xl border border-gray-100/80 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] p-4 sm:p-5 h-fit xl:sticky xl:top-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Agenda</p>
              <h2 className="text-lg font-bold text-gray-900">
                {selectedDay.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </h2>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                {selectedDayEvents.length} event{selectedDayEvents.length === 1 ? '' : 's'}
              </p>

              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-gray-400 py-8 text-center">Nothing scheduled</p>
              ) : (
                <ul className="space-y-2.5 max-h-[min(70vh,520px)] overflow-y-auto scrollbar-none pr-0.5">
                  {selectedDayEvents.map((ev) => {
                    const isLive =
                      new Date(ev.startsAt) <= now && new Date(ev.endsAt) > now;
                    const duration = Math.round(
                      (new Date(ev.endsAt) - new Date(ev.startsAt)) / 60_000
                    );
                    return (
                      <li
                        key={ev.id}
                        className={`rounded-2xl border p-3.5 ${
                          isLive
                            ? 'border-amber-200/80 bg-amber-50/50'
                            : ev.showAs === 'free'
                              ? 'border-gray-200 bg-gray-50/50'
                              : 'border-indigo-100/80 bg-indigo-50/30'
                        }`}
                      >
                        <p className="text-sm font-semibold text-gray-900 leading-snug">{ev.title}</p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                          <Clock size={12} className="shrink-0" />
                          {formatTime(ev.startsAt)} – {formatTime(ev.endsAt)}
                          <span className="text-gray-400">· {duration}m</span>
                        </p>
                        {ev.isOnlineMeeting ? (
                          <p className="text-[10px] font-medium text-indigo-600 mt-1 flex items-center gap-1">
                            <Video size={12} />
                            Google Meet
                          </p>
                        ) : null}
                        {ev.canJoin && ev.id ? (
                          <Link
                            href={`/meet/${ev.id}`}
                            className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#615FFF] py-2 text-xs font-bold text-white hover:bg-[#545BE8] transition-colors"
                          >
                            <Video size={14} />
                            {isLive ? 'Join now' : 'Join meeting'}
                          </Link>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
