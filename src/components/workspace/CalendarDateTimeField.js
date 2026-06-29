'use client';

import { memo, useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import {
  getCalendarMonthCells,
  mergeDateIntoDatetimeLocal,
  mergeTimeIntoDatetimeLocal,
  parseCalendarDateTime,
  toDateInputValue,
  toDatetimeLocalValue,
} from '@/lib/calendarDateUtils';

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function formatHourLabel(hour) {
  const h = hour % 12 || 12;
  const meridiem = hour < 12 ? 'AM' : 'PM';
  return `${h}:00 ${meridiem}`;
}

function formatMinuteLabel(minute) {
  return String(minute).padStart(2, '0');
}

function formatTriggerDate(value) {
  const d = parseCalendarDateTime(value);
  if (Number.isNaN(d.getTime())) return 'Select date';
  return d.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTriggerTime(value) {
  const d = parseCalendarDateTime(value);
  if (Number.isNaN(d.getTime())) return 'Select time';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/**
 * @param {{
 *   id?: string;
 *   label: string;
 *   value: string;
 *   disabled?: boolean;
 *   open?: boolean;
 *   onOpenChange?: (open: boolean) => void;
 *   onChange: (value: string) => void;
 * }} props
 */
function CalendarDateTimeField({
  id,
  label,
  value,
  disabled = false,
  open: openProp,
  onOpenChange,
  onChange,
}) {
  const fallbackId = useId();
  const fieldId = id || fallbackId;
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [openInternal, setOpenInternal] = useState(false);
  const [browseMonth, setBrowseMonth] = useState(null);
  const [panelStyle, setPanelStyle] = useState(null);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : openInternal;

  const setOpen = useCallback(
    (next) => {
      if (!next) {
        setBrowseMonth(null);
        setPanelStyle(null);
      }
      if (isControlled) onOpenChange?.(next);
      else setOpenInternal(next);
    },
    [isControlled, onOpenChange]
  );

  const parsed = parseCalendarDateTime(value);
  const hasValue = !Number.isNaN(parsed.getTime());
  const fallbackMonth = {
    year: hasValue ? parsed.getFullYear() : new Date().getFullYear(),
    month: hasValue ? parsed.getMonth() : new Date().getMonth(),
  };
  const viewYear = browseMonth?.year ?? fallbackMonth.year;
  const viewMonth = browseMonth?.month ?? fallbackMonth.month;

  const measurePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return null;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 320), window.innerWidth - 16);
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    const estimatedHeight = 430;
    let top = rect.bottom + 8;
    if (top + estimatedHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - estimatedHeight - 8);
    }
    return { top, left, width };
  }, []);

  useEffect(() => {
    if (!open) return;
    const syncPosition = () => {
      requestAnimationFrame(() => {
        const nextStyle = measurePanelPosition();
        if (nextStyle) setPanelStyle(nextStyle);
      });
    };
    syncPosition();
    window.addEventListener('resize', syncPosition);
    return () => {
      window.removeEventListener('resize', syncPosition);
    };
  }, [open, measurePanelPosition]);

  useEffect(() => {
    if (!open) return;
    const handleScroll = (event) => {
      const target = event.target;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('scroll', handleScroll, true);
    return () => document.removeEventListener('scroll', handleScroll, true);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event) => {
      const target = event.target;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, setOpen]);

  const toggleOpen = () => {
    if (disabled) return;
    setOpen(!open);
  };

  const selectedDate = hasValue ? toDateInputValue(value) : '';
  const selectedHour = hasValue ? parsed.getHours() : 9;
  const selectedMinute = hasValue ? parsed.getMinutes() : 0;
  const { weekdayLabels, cells } = getCalendarMonthCells(viewYear, viewMonth);
  const today = new Date();
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString([], {
    month: 'long',
    year: 'numeric',
  });

  const shiftMonth = (delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setBrowseMonth({ year: next.getFullYear(), month: next.getMonth() });
  };

  const handleDaySelect = (cell) => {
    const dateValue = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
    const base = hasValue ? value : toDatetimeLocalValue(new Date(viewYear, viewMonth, cell.day, 9, 0, 0, 0));
    onChange(mergeDateIntoDatetimeLocal(dateValue, base));
  };

  const handleHourChange = (hour) => {
    const base = hasValue ? value : toDatetimeLocalValue(new Date());
    onChange(mergeTimeIntoDatetimeLocal(base, hour, selectedMinute));
  };

  const handleMinuteChange = (minute) => {
    const base = hasValue ? value : value || toDatetimeLocalValue(new Date());
    onChange(mergeTimeIntoDatetimeLocal(base, selectedHour, minute));
  };

  return (
    <div className="relative">
      <span id={`${fieldId}-label`} className="sr-only">
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        id={fieldId}
        aria-labelledby={`${fieldId}-label`}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={toggleOpen}
        className={`flex w-full items-center gap-3 rounded-xl border bg-background px-4 py-3.5 text-left shadow-sm transition-[border-color,box-shadow,background-color] focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-60 ${
          open
            ? 'border-indigo-500/50 ring-2 ring-indigo-500/20'
            : 'border-border hover:border-indigo-500/30'
        }`}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <Calendar size={18} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-foreground">{formatTriggerDate(value)}</span>
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400">
              <Clock size={14} aria-hidden />
              {formatTriggerTime(value)}
            </span>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open && panelStyle
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label={`${label} picker`}
              style={{
                position: 'fixed',
                top: panelStyle.top,
                left: panelStyle.left,
                width: panelStyle.width,
                zIndex: 80,
              }}
              className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
              onMouseDown={(e) => e.stopPropagation()}
            >
          <div className="border-b border-border bg-muted/20 px-4 py-3 dark:bg-muted/10">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} />
              </button>
              <p className="text-sm font-semibold text-foreground">{monthLabel}</p>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Next month"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <div className="mt-3 grid grid-cols-7 gap-1">
              {weekdayLabels.map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                >
                  {day}
                </div>
              ))}
              {cells.map((cell) => {
                if (cell.type === 'padding') {
                  return <div key={cell.key} className="h-9" aria-hidden />;
                }

                const dateValue = `${cell.year}-${String(cell.month + 1).padStart(2, '0')}-${String(cell.day).padStart(2, '0')}`;
                const isSelected = selectedDate === dateValue;
                const isToday =
                  today.getFullYear() === cell.year &&
                  today.getMonth() === cell.month &&
                  today.getDate() === cell.day;

                return (
                  <button
                    key={cell.key}
                    type="button"
                    onClick={() => handleDaySelect(cell)}
                    className={`flex h-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm dark:bg-indigo-500'
                        : isToday
                          ? 'border border-indigo-500/40 text-indigo-600 hover:bg-indigo-500/10 dark:text-indigo-400'
                          : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`${fieldId}-hour`} className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Hour
                </label>
                <select
                  id={`${fieldId}-hour`}
                  value={selectedHour}
                  onChange={(e) => handleHourChange(Number(e.target.value))}
                  className="w-full appearance-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 [color-scheme:light] dark:[color-scheme:dark]"
                >
                  {HOURS.map((hour) => (
                    <option key={hour} value={hour}>
                      {formatHourLabel(hour)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor={`${fieldId}-minute`} className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Minute
                </label>
                <select
                  id={`${fieldId}-minute`}
                  value={selectedMinute}
                  onChange={(e) => handleMinuteChange(Number(e.target.value))}
                  className="w-full appearance-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 [color-scheme:light] dark:[color-scheme:dark]"
                >
                  {MINUTES.map((minute) => (
                    <option key={minute} value={minute}>
                      :{formatMinuteLabel(minute)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Done
            </button>
            </div>
          </div>,
            document.body
          )
        : null}
    </div>
  );
}

export default memo(CalendarDateTimeField);
