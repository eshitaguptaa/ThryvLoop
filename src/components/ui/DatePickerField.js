'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCalendarMonthCells } from '@/lib/calendarDateUtils';

const TONES = {
  violet: {
    open: 'border-[#5D3FD3]/50 ring-2 ring-[#5D3FD3]/20',
    iconWrap: 'bg-[#5D3FD3]/10 text-[#5D3FD3] dark:text-[#a89bf5]',
    selected: 'bg-[#5D3FD3] text-white shadow-sm',
    today: 'border border-[#5D3FD3]/40 text-[#5D3FD3] dark:text-[#a89bf5] hover:bg-[#5D3FD3]/10',
    action: 'text-[#5D3FD3] hover:bg-[#5D3FD3]/10 dark:text-[#a89bf5]',
  },
  orange: {
    open: 'border-orange-500/50 ring-2 ring-orange-500/25',
    iconWrap: 'bg-orange-500/10 text-orange-600 dark:text-orange-300',
    selected: 'bg-orange-500 text-white shadow-sm',
    today: 'border border-orange-500/40 text-orange-600 dark:text-orange-300 hover:bg-orange-500/10',
    action: 'text-orange-600 hover:bg-orange-500/10 dark:text-orange-300',
  },
};

function toYmd(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function todayYmd() {
  const n = new Date();
  return toYmd(n.getFullYear(), n.getMonth(), n.getDate());
}

function parseYmd(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return null;
  const [y, m, d] = value.trim().split('-').map(Number);
  if (!y || !m || !d) return null;
  return { year: y, month: m - 1, day: d };
}

function formatDisplay(value) {
  const parsed = parseYmd(value);
  if (!parsed) return null;
  return new Date(parsed.year, parsed.month, parsed.day).toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Date-only picker (YYYY-MM-DD). Replaces native <input type="date" />.
 *
 * @param {{
 *   id?: string,
 *   value: string,
 *   onChange: (next: string) => void,
 *   placeholder?: string,
 *   disabled?: boolean,
 *   tone?: 'violet' | 'orange',
 *   triggerClassName?: string,
 *   'aria-label'?: string,
 * }} props
 */
export default function DatePickerField({
  id,
  value = '',
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  tone = 'violet',
  triggerClassName = '',
  'aria-label': ariaLabel = 'Due date',
}) {
  const fallbackId = useId();
  const fieldId = id || fallbackId;
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [browseMonth, setBrowseMonth] = useState(null);
  const [panelStyle, setPanelStyle] = useState(null);
  const look = TONES[tone] || TONES.violet;
  const selected = parseYmd(value);
  const display = formatDisplay(value);

  const fallbackMonth = {
    year: selected?.year ?? new Date().getFullYear(),
    month: selected?.month ?? new Date().getMonth(),
  };
  const viewYear = browseMonth?.year ?? fallbackMonth.year;
  const viewMonth = browseMonth?.month ?? fallbackMonth.month;

  const measure = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return null;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(Math.max(rect.width, 300), window.innerWidth - 16);
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    const estimatedHeight = 360;
    let top = rect.bottom + 8;
    if (top + estimatedHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - estimatedHeight - 8);
    }
    return { top, left, width };
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setBrowseMonth(null);
    setPanelStyle(null);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const sync = () => {
      requestAnimationFrame(() => {
        const next = measure();
        if (next) setPanelStyle(next);
      });
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [open, measure]);

  useEffect(() => {
    if (!open) return undefined;
    const onScroll = (event) => {
      if (panelRef.current?.contains(event.target)) return;
      if (triggerRef.current?.contains(event.target)) return;
      close();
    };
    document.addEventListener('scroll', onScroll, true);
    return () => document.removeEventListener('scroll', onScroll, true);
  }, [open, close]);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (triggerRef.current?.contains(event.target)) return;
      if (panelRef.current?.contains(event.target)) return;
      close();
    };
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      close();
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, close]);

  const { weekdayLabels, cells } = getCalendarMonthCells(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString([], {
    month: 'long',
    year: 'numeric',
  });
  const today = todayYmd();

  const shiftMonth = (delta) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setBrowseMonth({ year: next.getFullYear(), month: next.getMonth() });
  };

  const pick = (ymd) => {
    onChange?.(ymd);
    close();
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        id={fieldId}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (disabled) return;
          setOpen((v) => {
            const next = !v;
            if (!next) {
              setBrowseMonth(null);
              setPanelStyle(null);
            }
            return next;
          });
        }}
        className={[
          'flex w-full cursor-pointer items-center gap-2.5 text-left transition-[border-color,box-shadow] disabled:cursor-not-allowed disabled:opacity-60',
          triggerClassName,
          open ? look.open : '',
        ].join(' ')}
      >
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${look.iconWrap}`}>
          <Calendar className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span className={`min-w-0 flex-1 truncate text-sm ${display ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
          {display || placeholder}
        </span>
      </button>

      {open && panelStyle && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={panelRef}
              role="dialog"
              aria-label="Choose a date"
              style={{
                position: 'fixed',
                top: panelStyle.top,
                left: panelStyle.left,
                width: panelStyle.width,
                zIndex: 1100,
              }}
              className="animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_-16px_rgba(0,0,0,0.45)] duration-150"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="px-3.5 pt-3.5 pb-2">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => shiftMonth(-1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <p className="text-sm font-semibold text-foreground">{monthLabel}</p>
                  <button
                    type="button"
                    onClick={() => shiftMonth(1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    aria-label="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-7 gap-0.5">
                  {weekdayLabels.map((day) => (
                    <div
                      key={day}
                      className="py-1 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground"
                    >
                      {day}
                    </div>
                  ))}
                  {cells.map((cell) => {
                    if (cell.type === 'padding') {
                      return <div key={cell.key} className="h-9" aria-hidden />;
                    }
                    const ymd = toYmd(cell.year, cell.month, cell.day);
                    const isSelected = value === ymd;
                    const isToday = today === ymd;
                    return (
                      <button
                        key={cell.key}
                        type="button"
                        onClick={() => pick(ymd)}
                        className={`flex h-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? look.selected
                            : isToday
                              ? look.today
                              : 'text-foreground hover:bg-muted'
                        }`}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-border px-3.5 py-2.5">
                <button
                  type="button"
                  onClick={() => pick('')}
                  className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => pick(todayYmd())}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${look.action}`}
                >
                  Today
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
