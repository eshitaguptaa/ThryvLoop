'use client';

import { Plus, Trash2 } from 'lucide-react';
import {
  COMMON_TIMEZONES,
  FOCUS_DAY_OPTIONS,
} from '@/lib/orgPulse';
import WorkspaceSelect from '@/components/b2b/WorkspaceSelect';

const timeFieldClass = [
  'h-10 min-w-[6.75rem] rounded-xl border border-border bg-card px-2.5 text-sm font-semibold tabular-nums text-foreground',
  'shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
  'hover:border-[#5D3FD3]/35',
  'focus:outline-none focus:ring-2 focus:ring-[#5D3FD3]/25 focus:border-[#5D3FD3]/40',
  'dark:border-white/[0.1] dark:bg-[#1a2332]',
  'disabled:opacity-45 disabled:cursor-not-allowed',
  '[color-scheme:light] dark:[color-scheme:dark]',
].join(' ');

/**
 * Controlled focus-schedule editor for workspace settings.
 * Submits via: focus_enabled, focus_timezone, focus_windows (JSON).
 */
export default function FocusHoursEditor({
  enabled,
  onEnabledChange,
  timezone,
  onTimezoneChange,
  windows,
  onWindowsChange,
}) {
  const updateWindow = (index, patch) => {
    onWindowsChange(windows.map((w, i) => (i === index ? { ...w, ...patch } : w)));
  };

  const removeWindow = (index) => {
    onWindowsChange(windows.filter((_, i) => i !== index));
  };

  const addWindow = () => {
    onWindowsChange([...windows, { day: 1, start: '09:00', end: '12:00' }]);
  };

  const toggleEnabled = () => {
    onEnabledChange(!enabled);
  };

  const tzOptions = (() => {
    const list = [...COMMON_TIMEZONES];
    if (timezone && !list.includes(timezone)) list.unshift(timezone);
    return list;
  })();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5D3FD3] dark:text-[#a89bf5] mb-1">
            Rhythm
          </p>
          <h2 id="ws-focus-hours-heading" className="text-base sm:text-lg font-semibold text-foreground tracking-tight">
            Focus schedule
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Team deep-work blocks · live on the Rhythm page
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-labelledby="ws-focus-hours-heading"
          onClick={toggleEnabled}
          className={`inline-flex shrink-0 items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition-colors ${
            enabled
              ? 'border-[#5D3FD3] bg-[rgba(93,63,211,0.1)] dark:bg-[rgba(93,63,211,0.22)]'
              : 'border-border bg-background shadow-sm dark:border-white/20 dark:bg-[#0f1522]'
          }`}
        >
          <span
            className={`text-xs font-bold uppercase tracking-wide ${
              enabled ? 'text-[#5D3FD3] dark:text-[#c4b5fd]' : 'text-muted-foreground'
            }`}
          >
            {enabled ? 'On' : 'Off'}
          </span>
          <span
            className={`relative block h-7 w-12 rounded-full transition-colors ${
              enabled
                ? 'bg-[#5D3FD3]'
                : 'bg-slate-300 dark:bg-slate-600'
            }`}
            aria-hidden
          >
            <span
              className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md ring-1 ring-black/5 transition-transform ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </span>
        </button>
      </div>

      {/* Autosave builds FormData in the parent — no form field names required */}
      <div className="hidden" aria-hidden>
        <span data-focus-enabled={enabled ? 'true' : 'false'} />
      </div>

      <div
        className={`space-y-4 transition-opacity ${enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}
        aria-disabled={!enabled}
      >
        <div>
          <label
            htmlFor="focus-tz"
            className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Timezone
          </label>
          <WorkspaceSelect
            id="focus-tz"
            value={timezone}
            onChange={(e) => onTimezoneChange(e.target.value)}
            size="md"
            className="mt-1.5 w-full block"
            disabled={!enabled}
          >
            {tzOptions.map((tz) => (
              <option key={tz} value={tz}>
                {tz.replace(/_/g, ' ')}
              </option>
            ))}
          </WorkspaceSelect>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Windows
            </p>
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {windows.length} {windows.length === 1 ? 'block' : 'blocks'}
            </span>
          </div>

          {windows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center dark:bg-white/[0.03]">
              <p className="text-sm text-muted-foreground">No focus blocks</p>
              <button
                type="button"
                onClick={addWindow}
                disabled={!enabled}
                className="mt-2 text-xs font-semibold text-[#5D3FD3] hover:underline disabled:no-underline"
              >
                Add a window
              </button>
            </div>
          ) : (
            <ul className="space-y-2">
              {windows.map((w, i) => (
                <li
                  key={i}
                  className="rounded-xl border border-border bg-card p-3 shadow-sm dark:border-white/[0.08] dark:bg-white/[0.03]"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div
                      className="flex flex-wrap gap-1"
                      role="group"
                      aria-label={`Day for window ${i + 1}`}
                    >
                      {FOCUS_DAY_OPTIONS.map((d) => {
                        const active = Number(w.day) === d.value;
                        return (
                          <button
                            key={d.value}
                            type="button"
                            disabled={!enabled}
                            onClick={() => updateWindow(i, { day: d.value })}
                            title={d.label}
                            className={`h-9 min-w-[2.15rem] rounded-lg px-2 text-xs font-semibold transition-colors ${
                              active
                                ? 'bg-[#5D3FD3] text-white shadow-sm'
                                : 'border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:border-white/[0.1]'
                            }`}
                          >
                            <span className="sm:hidden">{d.short}</span>
                            <span className="hidden sm:inline">{d.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                      <input
                        type="time"
                        value={w.start}
                        disabled={!enabled}
                        onChange={(e) => updateWindow(i, { start: e.target.value || '09:00' })}
                        className={timeFieldClass}
                        aria-label={`Start time window ${i + 1}`}
                      />
                      <span className="text-xs font-medium text-muted-foreground">to</span>
                      <input
                        type="time"
                        value={w.end}
                        disabled={!enabled}
                        onChange={(e) => updateWindow(i, { end: e.target.value || '12:00' })}
                        className={timeFieldClass}
                        aria-label={`End time window ${i + 1}`}
                      />
                      <button
                        type="button"
                        disabled={!enabled}
                        onClick={() => removeWindow(i)}
                        className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-white/[0.1] dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                        aria-label={`Delete window ${i + 1}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {windows.length > 0 ? (
            <button
              type="button"
              onClick={addWindow}
              disabled={!enabled}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-[#5D3FD3]/35 hover:bg-muted/40 dark:border-white/[0.1]"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              Add window
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
