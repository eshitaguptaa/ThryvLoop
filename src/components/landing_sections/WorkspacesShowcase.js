'use client';

import { useEffect, useState } from 'react';
import FeatureCardIcon from '@/components/landing_sections/FeatureCardIcon';

const WORKSPACES = [
  { id: 'product', name: 'Product Team', members: 8, progress: 67 },
  { id: 'design', name: 'Design Studio', members: 5, progress: 64 },
  { id: 'engineering', name: 'Engineering', members: 12, progress: 77 },
];

function FolderIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
      />
    </svg>
  );
}

export default function WorkspacesShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const active = WORKSPACES[activeIndex];

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setActiveIndex((i) => (i + 1) % WORKSPACES.length);
        setVisible(true);
      }, 220);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const goTo = (index) => {
    if (index === activeIndex) return;
    setVisible(false);
    setTimeout(() => {
      setActiveIndex(index);
      setVisible(true);
    }, 220);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl bg-card border border-border shadow-xl shadow-gray-100/60 dark:shadow-black/30 hover:shadow-2xl hover:shadow-[#5D3FD3]/10 hover:-translate-y-1 transition-all duration-300 h-full">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#5D3FD3]/12 rounded-full blur-3xl pointer-events-none group-hover:bg-[#5D3FD3]/20 transition-colors duration-500" />

      <div className="p-8 pb-2 relative z-10 shrink-0">
        <FeatureCardIcon icon="hub" tone="brand" className="mb-5" fill={1} />
        <h3 className="landing-card-title mb-1.5">Company Hubs</h3>
        <p className="landing-card-desc">
          One shared hub for your organization—goals, members, and analytics together.
        </p>
      </div>

      <div className="px-8 pb-8 relative z-10 flex flex-col flex-1 min-h-0">
        <div className="relative flex-1 min-h-[220px] lg:min-h-0 rounded-2xl border border-border bg-gradient-to-br from-[#5D3FD3]/[0.08] via-card to-violet-500/10 dark:to-violet-950/30 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 bg-[#5D3FD3]/15 rounded-full blur-3xl pointer-events-none" />

          <div
            className={`relative z-10 h-full flex flex-col items-center justify-center px-10 py-10 text-center transition-all duration-300 ease-out ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
          >
            <div className="h-16 w-16 rounded-2xl bg-[#5D3FD3] text-white flex items-center justify-center shadow-lg shadow-[#5D3FD3]/25 mb-6">
              <FolderIcon className="h-7 w-7" />
            </div>

            <p className="text-lg font-semibold tracking-tight text-foreground">{active.name}</p>
            <p className="text-sm text-muted-foreground mt-2 font-normal">{active.members} team members</p>

            <div className="w-full max-w-[200px] mt-8 flex items-center gap-3">
              <div className="flex-1 h-1.5 rounded-full bg-[#5D3FD3]/12 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#5D3FD3] transition-all duration-700 ease-out"
                  style={{ width: `${active.progress}%` }}
                />
              </div>
              <span className="text-sm font-bold text-[#5D3FD3] tabular-nums shrink-0">
                {active.progress}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2.5 mt-4 shrink-0">
          {WORKSPACES.map((ws, i) => (
            <button
              key={ws.id}
              type="button"
              onMouseEnter={() => goTo(i)}
              onFocus={() => goTo(i)}
              onClick={() => goTo(i)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                i === activeIndex
                  ? 'bg-[#5D3FD3] text-white shadow-md shadow-[#5D3FD3]/20'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {ws.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
