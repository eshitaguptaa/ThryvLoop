'use client';

import FeatureCardIcon from '@/components/landing_sections/FeatureCardIcon';

const DEPARTMENTS = [
  { id: 'product', name: 'Product', members: 8, progress: 67 },
  { id: 'design', name: 'Design', members: 5, progress: 64 },
  { id: 'engineering', name: 'Engineering', members: 12, progress: 77 },
];

export default function WorkspacesShowcase() {
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

          <div className="relative z-10 h-full flex flex-col px-6 py-6 sm:px-8 sm:py-8">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-border/80">
              <div className="h-10 w-10 rounded-xl bg-[#5D3FD3] text-white flex items-center justify-center shadow-md shadow-[#5D3FD3]/25 shrink-0">
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  hub
                </span>
              </div>
              <div className="min-w-0 text-left">
                <p className="text-sm font-bold text-foreground truncate">Acme Co. Hub</p>
                <p className="text-xs text-muted-foreground">25 members · single workspace</p>
              </div>
            </div>

            <ul className="space-y-3 flex-1" aria-label="Department progress in company hub">
              {DEPARTMENTS.map((dept) => (
                <li key={dept.id} className="rounded-xl bg-card/80 border border-border/60 px-3 py-2.5">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-sm font-semibold text-foreground">{dept.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">{dept.members} people</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-[#5D3FD3]/12 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#5D3FD3]"
                        style={{ width: `${dept.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#5D3FD3] tabular-nums shrink-0">
                      {dept.progress}%
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
