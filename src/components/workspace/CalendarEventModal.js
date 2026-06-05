'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, Heart, Loader2, MapPin, Trash2, Video, X, Bell } from 'lucide-react';
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
  toDatetimeLocalValue,
} from '@/lib/calendarDateUtils';
import { findOverlappingEvents } from '@/lib/calendarEventLayout';

const inputClass =
  'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-gray-700 shadow-sm hover:shadow-md transition-shadow disabled:bg-gray-50 disabled:opacity-70';

const labelClass = 'block text-sm font-semibold text-gray-700 mb-2';

function defaultRangeForDay(day) {
  const start = new Date(day);
  start.setHours(9, 0, 0, 0);
  const end = new Date(day);
  end.setHours(10, 0, 0, 0);
  return { start, end };
}

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
    if (!open) return;
    setConfirmDelete(false);
    setLocalError('');
    if (mode === 'create') {
      const range = initialRange ?? defaultRangeForDay(anchorDay || new Date());
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
      showAs,
      remindBeforeMinutes: remindEnabled ? DEFAULT_CALENDAR_REMIND_MINUTES : null,
    });
  };

  const remindToggle = (
    <div className="flex items-center justify-between gap-4 rounded-xl border-2 border-indigo-100/80 bg-indigo-50/40 px-4 py-3.5">
      <div className="flex items-start gap-3 min-w-0">
        <Bell size={18} className="text-indigo-600 shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-gray-900">Remind me</p>
          <p className="text-xs text-gray-600 mt-0.5">
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
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
          remindEnabled ? 'bg-indigo-600 border-indigo-600' : 'bg-gray-200 border-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform mt-0.5 ${
            remindEnabled ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );

  const modalTitle =
    mode === 'create' ? 'New Event' : event?.source === 'google' ? 'Event Details' : 'Edit Event';

  const modalSubtitle =
    mode === 'create'
      ? hasGoogleConnection
        ? 'Creates in ThryvLoop and pushes to Google Calendar'
        : 'Schedule on your ThryvLoop calendar'
      : event?.source === 'google'
        ? 'Synced from Google Calendar'
        : event?.syncedToGoogle
          ? 'Updates ThryvLoop and Google Calendar'
          : 'Update this event';

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-modal-title"
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-100/80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-2xl">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                isGoogleView ? 'bg-indigo-100' : 'bg-violet-100'
              }`}
            >
              <Calendar
                size={22}
                className={isGoogleView ? 'text-indigo-600' : 'text-violet-600'}
              />
            </div>
            <div className="min-w-0">
              <p className="text-indigo-500 text-[10px] font-semibold uppercase tracking-widest">
                {modalSubtitle}
              </p>
              <h2 id="calendar-event-modal-title" className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {modalTitle}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 shrink-0"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {isGoogleView && event?.source === 'google' ? (
          <div className="p-6 space-y-5">
            <div className="rounded-xl border-2 border-gray-100 bg-gradient-to-br from-indigo-50/80 to-violet-50/50 p-4">
              <p className="text-lg font-bold text-gray-900 leading-snug">{event.title}</p>
              <p className="text-sm text-gray-600 mt-2 font-medium">
                {formatEventWhen(event.startsAt, event.endsAt)}
              </p>
              {event.showAs === 'free' ? (
                <span className="inline-block mt-3 text-xs font-semibold text-gray-600 bg-white/80 border border-gray-200 rounded-lg px-2.5 py-1">
                  Shown as free
                </span>
              ) : null}
              {event.isOnlineMeeting ? (
                <p className="text-sm text-indigo-600 font-semibold mt-3 flex items-center gap-2">
                  <Video size={16} />
                  Google Meet
                </p>
              ) : null}
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              This event is managed in Google Calendar. Make changes there, then use{' '}
              <span className="font-semibold text-gray-800">Sync</span> on the calendar page to refresh.
            </p>
            {remindToggle}
            <button
              type="button"
              onClick={onClose}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {displayError ? (
              <div
                role="alert"
                className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium"
              >
                {displayError}
              </div>
            ) : null}

            {overlappingEvents.length > 0 ? (
              <div
                role="status"
                className="rounded-xl border-2 border-amber-100 bg-gradient-to-br from-amber-50/90 to-orange-50/50 px-4 py-3.5 text-sm text-amber-950"
              >
                <div className="flex gap-3">
                  <Heart size={18} className="shrink-0 text-amber-500 mt-0.5" aria-hidden />
                  <div>
                    <p className="font-semibold text-amber-900">
                      {overlappingEvents.length === 1
                        ? 'You already have something here'
                        : 'This overlaps with other events'}
                    </p>
                    <ul className="mt-1.5 space-y-1 text-amber-900/90">
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
                      <p className="mt-1 text-xs text-amber-800/80">
                        +{overlappingEvents.length - 3} more
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-amber-800/90 leading-relaxed">
                      No worries if you meant to stack these — you can still save. We just wanted
                      to give you a heads-up.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div>
              <label htmlFor="cal-title" className={labelClass}>
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
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cal-starts" className={labelClass}>
                  Starts
                </label>
                <input
                  id="cal-starts"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => {
                    setStartsAt(e.target.value);
                    clearErrors();
                  }}
                  required
                  disabled={!isEditable || saving}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="cal-ends" className={labelClass}>
                  Ends
                </label>
                <input
                  id="cal-ends"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => {
                    setEndsAt(e.target.value);
                    clearErrors();
                  }}
                  required
                  disabled={!isEditable || saving}
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  For overnight events (e.g. 11 PM–midnight), set the end <span className="font-medium">date</span> to the next day.
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="cal-show-as" className={labelClass}>
                Availability
              </label>
              <select
                id="cal-show-as"
                value={showAs}
                onChange={(e) => setShowAs(e.target.value)}
                disabled={!isEditable || saving}
                className={inputClass}
              >
                <option value="busy">Busy</option>
                <option value="free">Free</option>
              </select>
            </div>

            {remindToggle}

            <div>
              <label htmlFor="cal-location" className={labelClass}>
                Location
              </label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  id="cal-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={!isEditable || saving}
                  placeholder="Optional"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="cal-notes" className={labelClass}>
                Notes
              </label>
              <textarea
                id="cal-notes"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                disabled={!isEditable || saving}
                placeholder="Optional details"
                className={`${inputClass} resize-none`}
              />
            </div>

            {mode === 'edit' && onDelete ? (
              <div className="pt-2 border-t border-gray-100">
                {confirmDelete ? (
                  <div className="rounded-xl border-2 border-red-100 bg-red-50/80 p-4 space-y-3">
                    <p className="text-sm font-semibold text-red-800">Delete this event permanently?</p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void onDelete()}
                        className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 px-4 py-2.5 rounded-xl font-medium text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="text-sm font-semibold text-red-600 hover:text-red-700 flex items-center gap-2 px-1 py-1"
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
                className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !isEditable}
                className="flex-1 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors shadow-lg disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={18} className="animate-spin" /> : null}
                {mode === 'create' ? 'Create Event' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
