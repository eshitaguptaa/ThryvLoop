'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  Pencil,
  RefreshCw,
  Video,
  Clock,
} from 'lucide-react';
import { workspaceApiFetch } from '@/lib/workspace/clientApi';
import CalendarEventModal from '@/components/workspace/CalendarEventModal';
import {
  eventOverlapsLocalDay,
  isSameLocalDay,
  localDayKey,
  localMinutesFromMidnight,
} from '@/lib/calendarDateUtils';
import { layoutDayEventsForGrid } from '@/lib/calendarEventLayout';

const HOUR_START = 0;
const HOUR_END = 23;
const HOUR_HEIGHT = 56;
const HOURS = Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i);
const HOUR_COUNT = HOURS.length;
/** Room so first/last hour labels aren't clipped by the day header or container edge */
const TIME_GRID_INSET = 16;
const DEFAULT_SLOT_DURATION_MINUTES = 60;

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
  return isSameLocalDay(a, b);
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
  return localMinutesFromMidnight(iso);
}

/** @param {Date} day @param {number} clickY px from top of day column @param {number} gridBodyHeight full column height including insets */
function slotRangeFromClick(day, clickY, gridBodyHeight) {
  const contentHeight = gridBodyHeight - TIME_GRID_INSET * 2;
  const y = Math.max(0, Math.min(contentHeight, clickY - TIME_GRID_INSET));
  const hourIndex = Math.min(
    HOUR_COUNT - 1,
    Math.max(0, Math.floor((y / contentHeight) * HOUR_COUNT))
  );
  const totalMinutes = (HOUR_START + hourIndex) * 60;

  const start = new Date(day);
  start.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
  const end = new Date(start.getTime() + DEFAULT_SLOT_DURATION_MINUTES * 60 * 1000);
  return { start, end };
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
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [activeEvent, setActiveEvent] = useState(null);
  const [createSlotRange, setCreateSlotRange] = useState(null);
  const [eventSaving, setEventSaving] = useState(false);
  const [modalSaveError, setModalSaveError] = useState('');

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
    const rangeStart = startOfDay(weekStart);
    const rangeEnd = addDays(startOfDay(weekStart), 7);
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

  const openCreateModal = (slotRange = null) => {
    setCreateSlotRange(slotRange);
    setActiveEvent(null);
    setModalMode('create');
    setModalSaveError('');
    setModalOpen(true);
  };

  const openCreateModalAtSlot = (day, clickY, gridBodyHeight) => {
    const range = slotRangeFromClick(day, clickY, gridBodyHeight);
    setSelectedDay(startOfDay(day));
    openCreateModal(range);
  };

  const openEventModal = (ev) => {
    setActiveEvent(ev);
    setModalMode(ev.editable ? 'edit' : 'view');
    setModalSaveError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (eventSaving) return;
    setModalOpen(false);
    setActiveEvent(null);
    setCreateSlotRange(null);
    setModalSaveError('');
  };

  const saveEvent = async (payload) => {
    setEventSaving(true);
    setModalSaveError('');
    setError('');
    try {
      const isCreate = modalMode === 'create';
      const path = isCreate
        ? '/api/workspace/calendar/events'
        : `/api/workspace/calendar/events/${activeEvent.id}`;
      const res = await workspaceApiFetch(
        path,
        {
          method: isCreate ? 'POST' : 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
        getToken
      );
      const json = await res.json();
      if (!res.ok) {
        setModalSaveError(json.error || 'Could not save this event. Check the details and try again.');
        return;
      }
      if (json.event) {
        setEvents((prev) => {
          const key = (e) => `${e.source}-${e.id}`;
          const merged = [...prev.filter((e) => key(e) !== key(json.event)), json.event];
          return merged.sort(
            (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
          );
        });
      }
      setModalOpen(false);
      setActiveEvent(null);
      setCreateSlotRange(null);
      setModalSaveError('');
      await fetchCalendar();
    } catch {
      setModalSaveError('Could not save this event. Please try again.');
    } finally {
      setEventSaving(false);
    }
  };

  const deleteEvent = async () => {
    if (!activeEvent?.id) return;
    setEventSaving(true);
    setError('');
    try {
      const res = await workspaceApiFetch(
        `/api/workspace/calendar/events/${activeEvent.id}`,
        { method: 'DELETE' },
        getToken
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete event');
      setModalOpen(false);
      setActiveEvent(null);
      await fetchCalendar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete event');
    } finally {
      setEventSaving(false);
    }
  };

  const appEventCount = useMemo(
    () => events.filter((e) => e.source === 'app').length,
    [events]
  );

  const eventsByLocalDate = useMemo(() => {
    const map = new Map();
    for (const ev of events) {
      const key = localDayKey(ev.startsAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(ev);
    }
    return map;
  }, [events]);

  const gridSegmentOpts = useMemo(
    () => ({ hourStart: HOUR_START, hourCount: HOUR_COUNT }),
    []
  );

  const eventsByDay = useMemo(() => {
    const map = new Map();
    for (const day of weekDays) {
      map.set(day.toDateString(), []);
    }
    for (const ev of events) {
      for (const day of weekDays) {
        if (eventOverlapsLocalDay(ev, day)) {
          map.get(day.toDateString()).push(ev);
        }
      }
    }
    return map;
  }, [events, weekDays]);

  const eventLayoutsByDay = useMemo(() => {
    const map = new Map();
    for (const day of weekDays) {
      const dayEvents = eventsByDay.get(day.toDateString()) || [];
      map.set(day.toDateString(), layoutDayEventsForGrid(dayEvents, day, gridSegmentOpts));
    }
    return map;
  }, [eventsByDay, weekDays, gridSegmentOpts]);

  const selectedDayEvents = useMemo(() => {
    const list = eventsByDay.get(selectedDay.toDateString()) || [];
    return [...list].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  }, [eventsByDay, selectedDay]);

  const now = new Date();
  const nowMinutes = eventMinutesFromMidnight(now);
  const gridHeight = HOUR_COUNT * HOUR_HEIGHT;
  const gridBodyHeight = gridHeight + TIME_GRID_INSET * 2;

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#1A1A1A] px-4 pt-2 pb-8 sm:px-6 sm:pt-4 md:px-8 lg:px-12 font-(--font-poppins)">
      <div className="max-w-[1920px] mx-auto">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <p className="text-indigo-500 text-xs font-semibold uppercase tracking-widest mb-2">Schedule</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">Calendar</h1>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              {hasConnection && accountEmail
                ? `ThryvLoop events + Google (${accountEmail})`
                : 'Schedule in ThryvLoop — connect Google to sync external events'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => openCreateModal()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus size={16} />
              New Event
            </button>
            <button
              type="button"
              onClick={goToday}
              className="px-4 py-2.5 rounded-xl border-2 border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all"
            >
              Today
            </button>
            <div className="flex items-center rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:shadow-md overflow-hidden transition-shadow">
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
          <div className="mb-6 rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
            {error}
          </div>
        ) : null}

        <p className="mb-4 text-xs text-gray-500 font-medium hidden sm:block">
          Tip: click any empty time in the week view to schedule · ThryvLoop events are editable, Google events sync read-only
        </p>

        {!hasConnection && !loading ? (
          <div className="mb-5 rounded-xl border-2 border-indigo-100 bg-indigo-50/60 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-indigo-900/90">
              <span className="font-semibold">Google Calendar not connected.</span> You can still create events
              here. Connect Google to import meetings and Meet links.
            </p>
            <Link
              href="/settings/integrations"
              className="shrink-0 inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
            >
              Connect Google
            </Link>
          </div>
        ) : null}

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(168px,188px)_minmax(0,1fr)_minmax(220px,248px)] gap-4 sm:gap-5 xl:gap-4">
            {/* Mini month */}
            <aside className="bg-white rounded-2xl border-2 border-gray-100/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] p-3 sm:p-4 h-fit self-start xl:sticky xl:top-6 xl:max-w-[188px]">
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
                  const hasEvents = (eventsByLocalDate.get(day.toDateString()) || []).length > 0;
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

            {/* Week grid — click empty cells to create at that time (30-min snap, 1 hr default) */}
            <section className="bg-white rounded-2xl border-2 border-gray-100/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] overflow-hidden min-h-[480px]">
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

                  <div className="grid grid-cols-[52px_repeat(7,1fr)] overflow-x-auto overflow-y-auto max-h-[min(720px,70vh)] pb-1">
                    <div className="border-r border-gray-100 relative" style={{ height: gridBodyHeight }}>
                      {HOURS.map((h) => {
                        const isFirst = h === HOUR_START;
                        const isLast = h === HOUR_END;
                        return (
                        <div
                          key={h}
                          className={`absolute left-0 right-0 text-[10px] text-gray-400 font-medium pr-2 text-right leading-none ${
                            isFirst ? 'translate-y-0' : isLast ? '-translate-y-full' : '-translate-y-1/2'
                          }`}
                          style={{ top: TIME_GRID_INSET + (h - HOUR_START) * HOUR_HEIGHT }}
                        >
                          {h === 0 ? '12 AM' : h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
                        </div>
                        );
                      })}
                    </div>

                    {weekDays.map((day) => {
                      const dayLayouts = eventLayoutsByDay.get(day.toDateString()) || [];
                      const isToday = isSameDay(day, now);
                      const showNowLine =
                        isToday && nowMinutes >= HOUR_START * 60 && nowMinutes <= HOUR_END * 60;

                      return (
                        <div
                          key={day.toISOString()}
                          className={`relative border-r border-gray-100 last:border-r-0 group/col cursor-pointer ${
                            isSameDay(day, selectedDay) ? 'bg-indigo-50/20' : ''
                          }`}
                          style={{ height: gridBodyHeight }}
                        >
                          <button
                            type="button"
                            className="absolute inset-0 z-0 w-full cursor-pointer opacity-0 hover:opacity-100 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-400/60 transition-opacity"
                            aria-label={`Add event on ${day.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}`}
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              openCreateModalAtSlot(day, e.clientY - rect.top, gridBodyHeight);
                            }}
                          >
                            <span className="sr-only">Add event at clicked time</span>
                          </button>
                          <div
                            className="absolute inset-0 z-[1] pointer-events-none opacity-0 group-hover/col:opacity-100 transition-opacity bg-indigo-500/[0.04]"
                            aria-hidden
                          />
                          {HOURS.map((h) => (
                            <div
                              key={h}
                              className="absolute left-0 right-0 border-t border-gray-100/80 pointer-events-none"
                              style={{ top: TIME_GRID_INSET + (h - HOUR_START) * HOUR_HEIGHT }}
                            />
                          ))}

                          {showNowLine ? (
                            <div
                              className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                              style={{
                                top:
                                  TIME_GRID_INSET +
                                  ((nowMinutes - HOUR_START * 60) / (HOUR_COUNT * 60)) *
                                    gridHeight,
                              }}
                            >
                              <span className="w-2 h-2 rounded-full bg-rose-500 -ml-1 shrink-0" />
                              <span className="flex-1 h-0.5 bg-rose-500/80" />
                            </div>
                          ) : null}

                          {dayLayouts.map(({ ev, clampStart, clampEnd, column, totalColumns }) => {
                            const top =
                              TIME_GRID_INSET +
                              ((clampStart - HOUR_START * 60) / (HOUR_COUNT * 60)) *
                                gridHeight;
                            const height = Math.max(
                              ((clampEnd - clampStart) / (HOUR_COUNT * 60)) * gridHeight,
                              28
                            );
                            const widthPct = 100 / totalColumns;
                            const leftPct = column * widthPct;
                            const isFree = ev.showAs === 'free';
                            const isLive =
                              new Date(ev.startsAt) <= now && new Date(ev.endsAt) > now;
                            const isApp = ev.source === 'app';

                            return (
                              <button
                                key={`${ev.source}-${ev.id}`}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedDay(startOfDay(new Date(ev.startsAt)));
                                  openEventModal(ev);
                                }}
                                className={`absolute z-10 rounded-lg px-1 py-1 text-left overflow-hidden border transition-shadow hover:shadow-md hover:z-20 pointer-events-auto ${
                                  isFree
                                    ? 'bg-gray-50/95 border-gray-200/80 border-dashed text-gray-600'
                                    : isLive
                                      ? isApp
                                        ? 'bg-gradient-to-br from-violet-100 to-indigo-50 border-violet-300/80 text-violet-950 ring-1 ring-violet-200/60'
                                        : 'bg-gradient-to-br from-amber-100 to-orange-50 border-amber-300/80 text-amber-950 ring-1 ring-amber-200/60'
                                      : isApp
                                        ? 'bg-gradient-to-br from-violet-50/95 to-indigo-50/95 border-violet-200/80 text-violet-950 shadow-sm'
                                        : 'bg-gradient-to-br from-indigo-100 to-violet-50 border-indigo-200/70 text-indigo-950'
                                }`}
                                style={{
                                  top,
                                  height,
                                  left: `calc(${leftPct}% + 2px)`,
                                  width: `calc(${widthPct}% - ${totalColumns > 1 ? 4 : 3}px)`,
                                }}
                              >
                                <p className="text-[10px] font-bold truncate leading-tight">{ev.title}</p>
                                <p className="text-[9px] opacity-80 truncate">
                                  {formatTime(ev.startsAt)}
                                </p>
                                {ev.isOnlineMeeting ? (
                                  <Video size={10} className="mt-0.5 opacity-70" />
                                ) : isApp && totalColumns === 1 ? (
                                  <span className="text-[8px] font-semibold text-violet-700/80 mt-0.5 block truncate">
                                    ThryvLoop
                                  </span>
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
            <aside className="bg-white rounded-2xl border-2 border-gray-100/60 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] p-3 sm:p-4 h-fit self-start xl:sticky xl:top-6 xl:max-w-[248px]">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Agenda</p>
              <h2 className="text-lg font-bold text-gray-900">
                {selectedDay.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
              </h2>
              <p className="text-xs text-gray-500 mt-1 mb-3">
                {selectedDayEvents.length} event{selectedDayEvents.length === 1 ? '' : 's'}
                {appEventCount > 0 ? ` · ${appEventCount} in ThryvLoop this week` : ''}
              </p>
              <button
                type="button"
                onClick={() => openCreateModal()}
                className="w-full mb-4 py-2.5 rounded-xl border-2 border-dashed border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-50/80 hover:border-indigo-300 transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <Plus size={14} />
                Add on this day
              </button>

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
                    const isApp = ev.source === 'app';
                    return (
                      <li
                        key={`${ev.source}-${ev.id}`}
                        className={`rounded-2xl border p-3.5 ${
                          isLive
                            ? isApp
                              ? 'border-violet-200/80 bg-violet-50/50'
                              : 'border-amber-200/80 bg-amber-50/50'
                            : ev.showAs === 'free'
                              ? 'border-gray-200 bg-gray-50/50'
                              : isApp
                                ? 'border-violet-100/80 bg-violet-50/30'
                                : 'border-indigo-100/80 bg-indigo-50/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-900 leading-snug flex-1">{ev.title}</p>
                          <button
                            type="button"
                            onClick={() => openEventModal(ev)}
                            className="shrink-0 p-1.5 rounded-lg hover:bg-white/80 text-gray-500 hover:text-gray-800"
                            aria-label={ev.editable ? 'Edit event' : 'View event'}
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                        {isApp ? (
                          <p className="text-[10px] font-semibold text-violet-600 mt-0.5 uppercase tracking-wide">ThryvLoop</p>
                        ) : null}
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
                            className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 shadow-sm transition-colors"
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

        <CalendarEventModal
          open={modalOpen}
          mode={modalMode}
          event={activeEvent}
          anchorDay={selectedDay}
          initialRange={modalMode === 'create' ? createSlotRange : null}
          saving={eventSaving}
          saveError={modalSaveError}
          existingEvents={events}
          onClearSaveError={() => setModalSaveError('')}
          onClose={closeModal}
          onSave={saveEvent}
          onDelete={modalMode === 'edit' && activeEvent?.editable ? deleteEvent : undefined}
        />
      </div>
    </div>
  );
}
