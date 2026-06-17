'use client';

import { useState } from 'react';
import FeatureCardIcon from '@/components/landing_sections/FeatureCardIcon';

const MaterialSymbol = ({ icon, className = '', fill = 1 }) => (
  <span
    className={`material-symbols-outlined ${className}`}
    style={{
      fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
    }}
  >
    {icon}
  </span>
);

const rowKeyDown = (handler) => (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handler();
  }
};

export default function GmailCalendarShowcase() {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  const [mailRead, setMailRead] = useState(false);
  const [joined, setJoined] = useState(false);

  const openCalendar = () => {
    setCalendarOpen((v) => {
      if (v) setJoined(false);
      return !v;
    });
    setMailOpen(false);
  };

  const openMail = () => {
    setMailOpen((v) => !v);
    setCalendarOpen(false);
    setJoined(false);
    if (!mailRead) setMailRead(true);
  };

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-card border border-border shadow-xl shadow-gray-100/50 dark:shadow-black/30 hover:shadow-2xl hover:shadow-blue-400/10 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-400/15 transition-colors" />

      <div className="p-8 pb-2 relative z-10 shrink-0">
        <FeatureCardIcon icon="stacked_email" tone="blue" className="mb-5" fill={1} />
        <h3 className="landing-card-title mb-1">Gmail & Calendar</h3>
        <p className="landing-card-desc">Unified inbox & schedule view.</p>
      </div>

      <div className="flex-1 flex flex-col px-6 pb-6 pt-0 relative z-10 min-h-0">
        <div className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col shadow-sm group-hover:shadow-md transition-shadow h-full min-h-[220px] lg:min-h-0">
          <div className="h-9 bg-muted/90 border-b border-border flex items-center px-4 gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
            <div className="ml-auto flex items-center gap-1.5">
              <MaterialSymbol icon="mail" className="text-[13px] text-gray-400" fill={0} />
              <MaterialSymbol icon="calendar_month" className="text-[13px] text-gray-400" fill={0} />
              <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider pl-1">
                Synced
              </span>
            </div>
          </div>

          <div className="p-4 space-y-3 relative flex-1">
            <div className="absolute left-[1.15rem] top-5 bottom-5 w-px bg-gradient-to-b from-blue-200 via-gray-200 to-red-200 z-0" />

            {/* Calendar row */}
            <div className="flex items-start gap-3 relative z-10 w-full group/cal">
              <div className="relative shrink-0">
                <div
                  className={`h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border shadow-sm transition-all duration-200 ${
                    calendarOpen
                      ? 'border-blue-300 ring-2 ring-blue-100/80 scale-[1.02]'
                      : 'border-blue-100 group-hover/cal:border-blue-200'
                  }`}
                >
                  <MaterialSymbol icon="calendar_month" className="text-xs" />
                </div>
                {calendarOpen && (
                  <span className="absolute -left-[1.125rem] top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-500 ring-2 ring-white" />
                )}
              </div>
              <div
                className={`flex-grow min-h-[52px] rounded-xl border transition-all duration-200 ${
                  calendarOpen
                    ? 'bg-blue-50/90 border-blue-200 shadow-sm'
                    : 'bg-blue-50/40 border-blue-100/80 group-hover/cal:bg-blue-50/70 group-hover/cal:border-blue-200'
                }`}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={openCalendar}
                  onKeyDown={rowKeyDown(openCalendar)}
                  className="p-2.5 w-full text-left cursor-pointer rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-200"
                >
                  <div className="flex justify-between items-start gap-2">
                    {calendarOpen ? (
                      <p className="text-xs font-bold text-gray-800 leading-snug">Team Standup</p>
                    ) : (
                      <div className="space-y-1.5 pt-0.5">
                        <div className="h-2 w-20 bg-gray-300/70 rounded-full" />
                      </div>
                    )}
                    <span
                      className={`text-[9px] font-bold shrink-0 px-1.5 py-0.5 rounded-md ${
                        calendarOpen
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-blue-600 bg-blue-100/80'
                      }`}
                    >
                      NOW
                    </span>
                  </div>
                  {calendarOpen ? (
                    <p className="text-[10px] text-blue-700/80 flex items-center gap-1 mt-1.5">
                      <MaterialSymbol icon="videocam" className="text-[11px]" fill={0} />
                      Google Meet · 30 min
                    </p>
                  ) : (
                    <div className="h-1.5 w-12 bg-blue-200/70 rounded-full mt-2" />
                  )}
                </div>
                {calendarOpen && (
                  <div className="px-2.5 pb-2.5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setJoined(true)}
                      disabled={joined}
                      className={`text-[9px] font-semibold px-2 py-0.5 rounded-md transition-colors ${
                        joined
                          ? 'bg-green-100 text-green-700 cursor-default'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {joined ? 'Joined ✓' : 'Join'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mail row */}
            <div
              role="button"
              tabIndex={0}
              onClick={openMail}
              onKeyDown={rowKeyDown(openMail)}
              className="flex items-start gap-3 relative z-10 w-full text-left cursor-pointer group/mail focus:outline-none focus-visible:ring-2 focus-visible:ring-red-100 rounded-xl"
            >
              <div className="relative shrink-0">
                <div
                  className={`h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-600 border shadow-sm transition-all duration-200 ${
                    mailOpen
                      ? 'border-red-200 ring-2 ring-red-100/80'
                      : 'border-red-100 group-hover/mail:border-red-200'
                  }`}
                >
                  <div className="relative">
                    <MaterialSymbol icon="mail" className="text-xs" />
                    {!mailRead && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full border border-white animate-pulse" />
                    )}
                  </div>
                </div>
                {mailOpen && (
                  <span className="absolute -left-[1.125rem] top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-red-400 ring-2 ring-white" />
                )}
              </div>
              <div
                className={`flex-grow min-h-[52px] p-2.5 rounded-xl border shadow-sm transition-all duration-200 ${
                  mailOpen
                    ? 'bg-card border-border translate-x-0.5 ring-1 ring-border'
                    : 'bg-card border-border group-hover/mail:translate-x-0.5 group-hover/mail:border-border'
                }`}
              >
                <div className="flex justify-between items-center gap-2 mb-1">
                  {mailOpen ? (
                    <p className="text-xs font-bold text-foreground truncate">Sarah Chen</p>
                  ) : (
                    <div className="h-2 w-16 bg-gray-800/80 rounded-full" />
                  )}
                  <span className="text-[9px] text-muted-foreground shrink-0 tabular-nums">10m ago</span>
                </div>
                {mailOpen ? (
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-foreground leading-snug">
                      Re: Q4 roadmap review
                    </p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                      Can we sync before the client call tomorrow?
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="h-1.5 w-full bg-muted rounded-full" />
                    <div className="h-1.5 w-2/3 bg-muted rounded-full" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
