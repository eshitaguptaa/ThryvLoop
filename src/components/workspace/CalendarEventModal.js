'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignLeft,
  Bell,
  Calendar,
  Clock,
  Heart,
  Loader2,
  MapPin,
  Trash2,
  Video,
  X,
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import {
  DEFAULT_CALENDAR_REMIND_MINUTES,
  calendarEventReminderKey,
  ensureCalendarNotificationPermission,
  getCalendarReminderPref,
  setCalendarReminderPref,
} from '@/lib/calendarReminderPrefs';
import {
  parseCalendarDateTime,
  parseInstant,
  resolveLocalTimeZone,
  toDatetimeLocalValue,
  defaultRangeForCalendarDay,
} from '@/lib/calendarDateUtils';
import { findOverlappingEvents } from '@/lib/calendarEventLayout';
import CalendarDateTimeField from '@/components/workspace/CalendarDateTimeField';

const fieldLabelClass = 'block text-sm font-semibold text-foreground mb-2';

const inputClass =
  'w-full rounded-xl border border-border bg-background px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/40 disabled:cursor-not-allowed disabled:opacity-60 transition-[box-shadow,border-color] [color-scheme:light] dark:[color-scheme:dark]';

const sectionClass =
  'rounded-2xl border border-border bg-muted/20 dark:bg-muted/10 p-6 space-y-5';

function formatEventWhen(startsAt, endsAt) {
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const datePart = start.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const startTime = start.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const endTime = end.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${datePart} · ${startTime} – ${endTime}`;
}

/**
 * @param {{
 *   open: boolean;
 *   mode: 'create' | 'edit' | 'view';
 *   event?: object | null;
 *   anchorDay?: Date;
 *   initialRange?: { start: Date; end: Date } | null;
 *   saving?: boolean;
 *   saveError?: string;
 *   hasGoogleConnection?: boolean;
 *   existingEvents?: Array<{ id?: string, title?: string, startsAt: string, endsAt: string }>;
 *   onClearSaveError?: () => void;
 *   onClose: () => void;
 *   onSave: (payload: object) => Promise<void>;
 *   onDelete?: () => Promise<void>;
 * }} props
 */
export default function CalendarEventModal({
  open,
  mode,
  event,
  anchorDay,
  initialRange = null,
  saving = false,
  saveError = '',
  hasGoogleConnection = false,
  existingEvents = [],
  onClearSaveError,
  onClose,
  onSave,
  onDelete,
}) {
  const { user } = useUser();
  const userId = user?.id || null;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [showAs, setShowAs] = useState('busy');
  const [remindEnabled, setRemindEnabled] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [localError, setLocalError] = useState('');
  const [activePicker, setActivePicker] = useState(null);
  const initializedForOpenRef = useRef(false);

  const displayError = localError || saveError;

  const clearErrors = () => {
    setLocalError('');
    onClearSaveError?.();
  };

  const isGoogleView = mode === 'view' || (event && event.source === 'google');
  const isEditable = mode === 'create' || (mode === 'edit' && event?.editable);

  const overlappingEvents = useMemo(() => {
    if (!isEditable || !startsAt || !endsAt) return [];
    return findOverlappingEvents(
      { startsAt, endsAt },
      existingEvents,
      mode === 'edit' ? event?.id : undefined
    );
  }, [isEditable, startsAt, endsAt, existingEvents, mode, event?.id]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      initializedForOpenRef.current = false;
      return;
    }
    if (initializedForOpenRef.current) return;
    initializedForOpenRef.current = true;

    setConfirmDelete(false);
    setLocalError('');
    setActivePicker(null);
    if (mode === 'create') {
      const range = initialRange ?? defaultRangeForCalendarDay(anchorDay || new Date());
      setTitle('');
      setDescription('');
      setLocation('');
      setStartsAt(toDatetimeLocalValue(range.start));
      setEndsAt(toDatetimeLocalValue(range.end));
      setShowAs('busy');
      setRemindEnabled(false);
      return;
    }
    if (event) {
      setTitle(event.title || '');
      setDescription(event.description || '');
      setLocation(event.location || '');
      setStartsAt(toDatetimeLocalValue(event.startsAt));
      setEndsAt(toDatetimeLocalValue(event.endsAt));
      setShowAs(event.showAs === 'free' ? 'free' : 'busy');
      if (event.source === 'app') {
        setRemindEnabled(event.remindBeforeMinutes === DEFAULT_CALENDAR_REMIND_MINUTES);
      } else {
        setRemindEnabled(
          getCalendarReminderPref(userId, calendarEventReminderKey(event)) ===
            DEFAULT_CALENDAR_REMIND_MINUTES
        );
      }
    }
  }, [open, mode, event, anchorDay, initialRange, userId]);

  const handleRemindToggle = async (next) => {
    clearErrors();
    if (next) {
      const perm = await ensureCalendarNotificationPermission();
      if (perm === 'denied') {
        setLocalError(
          'Notifications are blocked in your browser. Allow notifications for ThryvLoop to get meeting reminders.'
        );
        return;
      }
    }
    setRemindEnabled(next);
    if (event?.source === 'google' && event?.id) {
      setCalendarReminderPref(
        userId,
        calendarEventReminderKey(event),
        next ? DEFAULT_CALENDAR_REMIND_MINUTES : null
      );
    }
  };

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEditable || saving) return;
    setLocalError('');

    const start = parseCalendarDateTime(startsAt);
    const end = parseCalendarDateTime(endsAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setLocalError('Enter valid start and end times.');
      return;
    }
    if (end.getTime() <= start.getTime()) {
      setLocalError('End time must be after start time.');
      return;
    }
    if (!title.trim()) {
      setLocalError('Title is required.');
      return;
    }

    await onSave({
      title: title.trim(),
      description,
      location,
      startsAt: start.toISOString(),
      endsAt: end.toISOString(),
      startsAtLocal: startsAt,
      endsAtLocal: endsAt,
      showAs,
      remindBeforeMinutes: remindEnabled ? DEFAULT_CALENDAR_REMIND_MINUTES : null,
      timeZone: resolveLocalTimeZone(),
    });
  };

  const modalTitle =
    mode === 'create' ? 'New event' : event?.source === 'google' ? 'Event details' : 'Edit event';

  const modalSubtitle =
    mode === 'create'
      ? hasGoogleConnection
        ? 'Saved to ThryvLoop & Google Calendar'
        : 'On your ThryvLoop calendar'
      : event?.source === 'google'
        ? 'From Google Calendar'
        : event?.syncedToGoogle
          ? 'Syncs to Google Calendar'
          : 'ThryvLoop event';

  const remindToggle = (
    <div className="flex items-center justify-between gap-5 rounded-xl border border-border bg-background px-5 py-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <Bell size={18} aria-hidden />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Remind me</p>
          <p className="text-sm text-muted-foreground mt-1">
            {DEFAULT_CALENDAR_REMIND_MINUTES} minutes before · in-app alert
            {typeof Notification !== 'undefined' && Notification.permission === 'granted'
              ? ' + notification'
              : ''}
          </p>
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={remindEnabled}
        aria-label={`Remind me ${DEFAULT_CALENDAR_REMIND_MINUTES} minutes before`}
        disabled={saving}
        onClick={() => void handleRemindToggle(!remindEnabled)}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:ring-offset-2 focus:ring-offset-card disabled:opacity-50 ${
          remindEnabled
            ? 'border-indigo-600 bg-indigo-600 dark:border-indigo-500 dark:bg-indigo-500'
            : 'border-border bg-muted'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform mt-0.5 ${
            remindEnabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );

  const availabilityToggle = (
    <div className="flex rounded-xl border border-border bg-background p-1.5 gap-1.5">
      {[
        { value: 'busy', label: 'Busy' },
        { value: 'free', label: 'Free' },
      ].map((option) => {
        const active = showAs === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={!isEditable || saving}
            onClick={() => setShowAs(option.value)}
            className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
              active
                ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-modal-title"
        className="flex w-full max-w-2xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-border bg-card text-foreground shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative shrink-0 border-b border-border px-6 py-5 sm:px-8 sm:py-6">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-90" />
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-400">
                <Calendar size={24} aria-hidden />
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                  {modalSubtitle}
                </p>
                <h2
                  id="calendar-event-modal-title"
                  className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground"
                >
                  {modalTitle}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Body — lock scroll while a date/time picker is open so the fixed panel stays aligned */}
        <div
          className={`min-h-0 flex-1 ${activePicker ? 'overflow-hidden' : 'overflow-y-auto'}`}
        >
          {isGoogleView && event?.source === 'google' ? (
            <div className="space-y-6 p-6 sm:p-8">
              <div className="rounded-2xl border border-border bg-muted/20 dark:bg-muted/10 p-6">
                <p className="text-xl font-bold text-foreground leading-snug">{event.title}</p>
                <p className="mt-3 text-base text-muted-foreground">{formatEventWhen(event.startsAt, event.endsAt)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {event.showAs === 'free' ? (
                    <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      Free
                    </span>
                  ) : null}
                  {event.isOnlineMeeting ? (
                    <span className="inline-flex items-center gap-1 rounded-md border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:text-indigo-300">
                      <Video size={12} />
                      Google Meet
                    </span>
                  ) : null}
                </div>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                Edit this event in Google Calendar, then use <span className="font-semibold text-foreground">Sync</span> on the calendar page to refresh.
              </p>
              {remindToggle}
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-border bg-background px-5 py-3.5 text-base font-medium text-foreground transition-colors hover:bg-muted"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 p-6 sm:p-8">
              {displayError ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-4 text-sm text-red-700 dark:text-red-300"
                >
                  {displayError}
                </div>
              ) : null}

              {overlappingEvents.length > 0 ? (
                <div
                  role="status"
                  className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-5 py-4 text-sm"
                >
                  <div className="flex gap-3">
                    <Heart size={20} className="shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" aria-hidden />
                    <div className="text-amber-950 dark:text-amber-100">
                      <p className="font-semibold">
                        {overlappingEvents.length === 1
                          ? 'You already have something here'
                          : 'Overlaps with other events'}
                      </p>
                      <ul className="mt-2 space-y-1 text-amber-900/90 dark:text-amber-100/85">
                        {overlappingEvents.slice(0, 3).map((ev) => (
                          <li key={ev.id || `${ev.startsAt}-${ev.title}`}>
                            <span className="font-medium">{ev.title || '(No title)'}</span>
                            {' · '}
                            {parseInstant(ev.startsAt).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                            {' – '}
                            {parseInstant(ev.endsAt).toLocaleTimeString([], {
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </li>
                        ))}
                      </ul>
                      {overlappingEvents.length > 3 ? (
                        <p className="mt-1 text-xs opacity-80">+{overlappingEvents.length - 3} more</p>
                      ) : null}
                      <p className="mt-3 text-sm opacity-90 leading-relaxed">
                        No worries if you meant to stack these — you can still save. We just wanted to give you a heads-up.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div>
                <label htmlFor="cal-title" className={fieldLabelClass}>
                  Title *
                </label>
                <input
                  id="cal-title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    clearErrors();
                  }}
                  required
                  maxLength={500}
                  disabled={!isEditable || saving}
                  placeholder="Meeting, focus block, reminder…"
                  className={inputClass}
                  autoFocus
                />
              </div>

              <div className={sectionClass}>
                <div className="flex items-center gap-2.5 text-base font-semibold text-foreground">
                  <Clock size={18} className="text-indigo-600 dark:text-indigo-400" aria-hidden />
                  When
                </div>
                <div className="grid grid-cols-1 gap-5">
                  <CalendarDateTimeField
                    id="cal-starts"
                    label="Starts"
                    value={startsAt}
                    disabled={!isEditable || saving}
                    open={activePicker === 'start'}
                    onOpenChange={(next) => setActivePicker(next ? 'start' : null)}
                    onChange={(next) => {
                      setStartsAt(next);
                      clearErrors();
                    }}
                  />
                  <CalendarDateTimeField
                    id="cal-ends"
                    label="Ends"
                    value={endsAt}
                    disabled={!isEditable || saving}
                    open={activePicker === 'end'}
                    onOpenChange={(next) => setActivePicker(next ? 'end' : null)}
                    onChange={(next) => {
                      setEndsAt(next);
                      clearErrors();
                    }}
                  />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  For overnight events (e.g. 11 PM–midnight), set the end <span className="font-medium">date</span> to the next day.
                </p>
              </div>

              <div className={sectionClass}>
                <div className="flex items-center gap-2.5 text-base font-semibold text-foreground">
                  <AlignLeft size={18} className="text-indigo-600 dark:text-indigo-400" aria-hidden />
                  Details
                </div>
                <div>
                  <label htmlFor="cal-location" className={fieldLabelClass}>
                    Location
                  </label>
                  <div className="relative">
                    <MapPin
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <input
                      id="cal-location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={!isEditable || saving}
                      placeholder="Optional"
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="cal-notes" className={fieldLabelClass}>
                    Notes
                  </label>
                  <textarea
                    id="cal-notes"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    disabled={!isEditable || saving}
                    placeholder="Optional details"
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>

              <div className={sectionClass}>
                <p className="text-base font-semibold text-foreground">Options</p>
                <div>
                  <label className={fieldLabelClass}>Availability</label>
                  {availabilityToggle}
                </div>
                {remindToggle}
              </div>

              {mode === 'edit' && onDelete ? (
                <div className="pt-2 border-t border-border">
                  {confirmDelete ? (
                    <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-5 space-y-4">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                        Delete this event permanently?
                      </p>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void onDelete()}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                        >
                          {saving ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                          Delete
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(false)}
                          className="flex-1 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
                    >
                      <Trash2 size={16} />
                      Delete event
                    </button>
                  )}
                </div>
              ) : null}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1 rounded-xl border border-border bg-background px-5 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !isEditable}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-indigo-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                >
                  {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                  {mode === 'create' ? 'Create Event' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
