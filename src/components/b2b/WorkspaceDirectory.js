'use client';

import { ArrowUpRight, Clock, Eye, Plus, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import WorkspaceLogoAvatar from '@/components/b2b/WorkspaceLogoAvatar';
import {
  workspaceAccentIndex,
  workspaceProgressPalettes,
} from '@/components/b2b/workspaceShellClasses';
import { formatWorkspaceRelativeActive } from '@/lib/formatRelativeActive';
import { organizationLogoUrl } from '@/lib/workspaceLogo';

const transparencyPillClass =
  'inline-flex shrink-0 items-center gap-1 rounded-md bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800 border border-sky-500/25 dark:bg-sky-400/15 dark:text-sky-200 dark:border-sky-400/30';

export default function WorkspaceDirectory({ summaries }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return summaries;
    return summaries.filter((s) => {
      const name = s.organization.name?.toLowerCase() ?? '';
      const slug = s.organization.slug?.toLowerCase() ?? '';
      return name.includes(q) || slug.includes(q);
    });
  }, [summaries, query]);

  return (
    <>
      <div className="ws-rise ws-rise-delay-1 relative mb-6 w-full max-w-xl">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a workspace..."
          className="w-full rounded-xl border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus:border-[#5D3FD3]/45 focus:outline-none focus:ring-2 focus:ring-[#5D3FD3]/20 dark:border-white/[0.08] dark:bg-card/60"
          aria-label="Find a workspace"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">
          No workspaces match your search.
        </p>
      ) : (
        <ul className="w-full space-y-3">
          {filtered.map((s, idx) => {
            const slug = s.organization.slug;
            const name = s.organization.name;
            const activeLabel = formatWorkspaceRelativeActive(s.lastActiveAt);
            const pct =
              s.taskTotal > 0 ? Math.min(100, Math.round((s.taskDone / s.taskTotal) * 100)) : 0;
            const accent = workspaceAccentIndex(slug || name);
            const progress = workspaceProgressPalettes[accent];
            const delayClass = `ws-rise-delay-${Math.min(5, (idx % 5) + 1)}`;
            const memberLabel =
              s.memberCount === 1 ? '1 member' : `${s.memberCount} members`;
            const fullTransparency = s.insightsPolicy === 'full_individual';

            return (
              <li key={s.id} className={`w-full ws-rise ${delayClass}`}>
                <Link
                  href={`/o/${encodeURIComponent(slug)}`}
                  className="ws-card-sheen group relative block w-full overflow-hidden rounded-2xl border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5D3FD3]/30 hover:shadow-md dark:border-white/[0.08] dark:bg-card/70 dark:hover:border-[#5D3FD3]/40 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_6px_16px_-8px_rgba(15,23,42,0.08)] dark:shadow-none"
                >
                  <div className="flex items-center gap-3.5 px-4 py-4 sm:gap-4 sm:px-5 sm:py-4.5">
                    <WorkspaceLogoAvatar
                      name={name}
                      imageUrl={organizationLogoUrl(s.organization)}
                      className="h-11 w-11 sm:h-12 sm:w-12"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-base sm:text-lg font-semibold text-foreground group-hover:text-[#5D3FD3] dark:group-hover:text-[#c4b5fd] transition-colors">
                          {name}
                        </span>
                        {s.role === 'org:admin' ? (
                          <span className="shrink-0 rounded-md bg-[rgba(93,63,211,0.1)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5D3FD3] border border-[rgba(93,63,211,0.12)] dark:bg-[rgba(93,63,211,0.2)] dark:text-[#c4b5fd] dark:border-[rgba(93,63,211,0.25)]">
                            Admin
                          </span>
                        ) : null}
                        {fullTransparency ? (
                          <span
                            title="Full transparency: only workspace admins can view and download members’ personal reports (not other admins). Members can only download their own."
                            className={transparencyPillClass}
                          >
                            <Eye className="h-2.5 w-2.5" aria-hidden />
                            Full transparency
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                          {activeLabel ?? 'No recent activity'}
                        </span>
                        <span className="text-border">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                          {memberLabel}
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:flex shrink-0 flex-col items-end gap-1.5 min-w-[7.5rem]">
                      <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                        {s.taskDone} of {s.taskTotal} tasks
                      </span>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted dark:bg-white/10">
                        <div
                          className={`h-full rounded-full ${progress} transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <span className="hidden sm:inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors group-hover:border-[#5D3FD3]/30 group-hover:text-[#5D3FD3] dark:border-white/10">
                      <ArrowUpRight className="h-4 w-4" aria-hidden />
                    </span>
                  </div>

                  <div className="sm:hidden border-t border-border px-5 py-2.5 pl-5 bg-muted/30 dark:bg-white/[0.03] dark:border-white/[0.06]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
                        {s.taskDone} of {s.taskTotal} tasks
                      </span>
                      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted dark:bg-white/10">
                        <div
                          className={`h-full rounded-full ${progress}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/o/new"
        className="ws-rise ws-rise-delay-3 mt-5 group flex w-full items-center justify-center gap-2.5 rounded-2xl border border-dashed border-border py-4 text-sm font-semibold text-[#5D3FD3] transition-all duration-200 hover:border-[#5D3FD3]/45 hover:bg-[rgba(93,63,211,0.04)] dark:border-white/15 dark:text-[#c4b5fd] dark:hover:border-[#5D3FD3]/40 dark:hover:bg-[rgba(93,63,211,0.08)]"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[rgba(93,63,211,0.1)] dark:bg-[rgba(93,63,211,0.18)]">
          <Plus className="h-4 w-4" aria-hidden />
        </span>
        Create another workspace
      </Link>
    </>
  );
}
