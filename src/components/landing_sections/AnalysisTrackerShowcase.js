'use client';

import { useMemo, useState } from 'react';
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

const METRICS = {
  productivity: {
    id: 'productivity',
    label: 'Productivity Score',
    suffix: '%',
    bars: [
      { id: 'mon', label: 'Mon', height: 30, value: 72, change: 5 },
      { id: 'tue', label: 'Tue', height: 50, value: 81, change: 8 },
      { id: 'wed', label: 'Wed', height: 40, value: 76, change: 3 },
      { id: 'thu', label: 'Thu', height: 100, value: 94, change: 12 },
      { id: 'fri', label: 'Fri', height: 60, value: 86, change: 9 },
      { id: 'sat', label: 'Sat', height: 20, value: 58, change: -2 },
    ],
  },
  focus: {
    id: 'focus',
    label: 'Focus Time',
    suffix: 'm',
    bars: [
      { id: 'mon', label: 'Mon', height: 35, value: 142, change: 6 },
      { id: 'tue', label: 'Tue', height: 55, value: 198, change: 11 },
      { id: 'wed', label: 'Wed', height: 45, value: 165, change: 4 },
      { id: 'thu', label: 'Thu', height: 100, value: 248, change: 18 },
      { id: 'fri', label: 'Fri', height: 70, value: 210, change: 7 },
      { id: 'sat', label: 'Sat', height: 25, value: 95, change: -5 },
    ],
  },
  tasks: {
    id: 'tasks',
    label: 'Tasks Done',
    suffix: '',
    bars: [
      { id: 'mon', label: 'Mon', height: 40, value: 4, change: 1 },
      { id: 'tue', label: 'Tue', height: 55, value: 6, change: 2 },
      { id: 'wed', label: 'Wed', height: 35, value: 5, change: 0 },
      { id: 'thu', label: 'Thu', height: 100, value: 9, change: 3 },
      { id: 'fri', label: 'Fri', height: 65, value: 7, change: 2 },
      { id: 'sat', label: 'Sat', height: 15, value: 2, change: -1 },
    ],
  },
};

const METRIC_TABS = [
  { id: 'productivity', short: 'Score' },
  { id: 'focus', short: 'Focus' },
  { id: 'tasks', short: 'Tasks' },
];

const DEFAULT_BAR = 'thu';

function barGradient(selected, height) {
  if (selected) return 'bg-gradient-to-b from-purple-500 to-indigo-500 shadow-md';
  if (height >= 60) return 'bg-gradient-to-t from-purple-200 to-purple-300 dark:from-purple-800 dark:to-purple-600';
  if (height >= 40) return 'bg-gradient-to-t from-purple-100 to-purple-300 dark:from-purple-900 dark:to-purple-700';
  return 'bg-gradient-to-t from-purple-100 to-purple-200 dark:from-purple-950 dark:to-purple-800';
}

export default function AnalysisTrackerShowcase() {
  const [metricId, setMetricId] = useState('productivity');
  const [selectedBar, setSelectedBar] = useState(DEFAULT_BAR);

  const metric = METRICS[metricId];
  const bars = metric.bars;
  const activeBar = bars.find((b) => b.id === selectedBar) ?? bars[3];

  const displayValue = useMemo(() => {
    if (metric.suffix === '%') return `${activeBar.value}%`;
    if (metric.suffix === 'm') return `${activeBar.value}m`;
    return String(activeBar.value);
  }, [activeBar, metric.suffix]);

  const changePositive = activeBar.change >= 0;

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-card border border-border shadow-xl shadow-gray-200/50 dark:shadow-black/30 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
      <div className="p-6 lg:p-7 pb-2 relative z-10 shrink-0">
        <FeatureCardIcon icon="monitoring" tone="purple" className="mb-4" fill={1} />
        <h3 className="landing-card-title mb-1">Analysis Tracker</h3>
        <p className="landing-card-desc">Visualize trends & optimize.</p>
      </div>

      <div className="flex-1 flex flex-col px-5 pb-5 pt-1 lg:px-6 lg:pb-6 relative z-10 min-h-0">
        <div className="flex-1 flex flex-col bg-muted rounded-2xl border border-border p-4 lg:p-5 relative shadow-inner min-h-0">
          <div className="flex justify-between items-start mb-3 gap-3 shrink-0">
            <div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">
                {metric.label}
              </div>
              <div
                key={`${metricId}-${selectedBar}`}
                className="text-3xl font-black text-foreground tabular-nums transition-all duration-300"
              >
                {displayValue}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{activeBar.label}</p>
            </div>
            <div
              className={`px-2 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 shrink-0 transition-colors duration-300 ${
                changePositive
                  ? 'bg-green-100 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}
            >
              <MaterialSymbol
                icon={changePositive ? 'trending_up' : 'trending_down'}
                className="text-sm"
                fill={0}
              />
              {changePositive ? '+' : ''}
              {activeBar.change}
              {metric.suffix === '%' ? '%' : metric.suffix === 'm' ? 'm' : ''}
            </div>
          </div>

          <div className="flex gap-1.5 mb-3 shrink-0">
            {METRIC_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setMetricId(tab.id);
                  setSelectedBar(DEFAULT_BAR);
                }}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all duration-200 ${
                  metricId === tab.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {tab.short}
              </button>
            ))}
          </div>

          {/* Mobile — bars only, no tooltips */}
          <div className="flex md:hidden items-end justify-between gap-2 h-24 sm:h-28 w-full mt-auto shrink-0">
            {bars.map((bar) => {
              const selected = selectedBar === bar.id;
              const barHeight = selected ? Math.min(bar.height + 8, 100) : bar.height;

              return (
                <div key={bar.id} className="w-full relative flex items-end justify-center h-full min-w-0">
                  <button
                    type="button"
                    onClick={() => setSelectedBar(bar.id)}
                    aria-label={`${bar.label}: ${bar.value}${metric.suffix}`}
                    aria-pressed={selected}
                    className={`w-full rounded-t-md transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-violet-200/40 ${barGradient(
                      selected,
                      bar.height
                    )} ${selected ? 'hover:brightness-105' : 'hover:brightness-[0.97]'}`}
                    style={{ height: `${barHeight}%` }}
                  />
                </div>
              );
            })}
          </div>

          {/* Desktop — bars fill remaining space; tooltips float above */}
          <div className="hidden md:grid md:grid-cols-6 md:gap-2 md:flex-1 md:min-h-[9.5rem] md:items-end md:w-full md:pt-8 md:pb-1 min-h-0">
            {bars.map((bar) => {
              const selected = selectedBar === bar.id;
              const barHeight = selected ? Math.min(bar.height + 8, 100) : bar.height;

              return (
                <div key={bar.id} className="relative flex flex-col justify-end h-full min-h-0 min-w-0 group/bar">
                  <div
                    className="absolute bottom-full left-1/2 z-10 mb-1.5 flex -translate-x-1/2 flex-col items-center pointer-events-none opacity-0 transition-opacity duration-200 group-hover/bar:opacity-100"
                  >
                    <div className="bg-gray-900 text-white font-semibold text-xs px-2 py-1 rounded-md shadow-lg whitespace-nowrap">
                      {bar.label} · {bar.value}
                      {metric.suffix}
                    </div>
                    <svg
                      className="mx-auto mt-1"
                      width="16"
                      height="8"
                      viewBox="0 0 20 10"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden
                    >
                      <path d="M10 10L0 0H20L10 10Z" fill="#111827" />
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBar(bar.id)}
                    aria-label={`${bar.label}: ${bar.value}${metric.suffix}`}
                    aria-pressed={selected}
                    className={`w-full rounded-t-md transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-violet-200/40 ${barGradient(
                      selected,
                      bar.height
                    )} ${selected ? 'hover:brightness-105' : 'hover:brightness-[0.97]'}`}
                    style={{ height: `${barHeight}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
