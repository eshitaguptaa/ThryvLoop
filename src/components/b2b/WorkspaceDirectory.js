'use client';

import { Clock, FolderPlus, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { workspaceCardClass } from '@/components/b2b/workspaceShellClasses';
import { formatWorkspaceRelativeActive } from '@/lib/formatRelativeActive';

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
      <div className="relative mb-6 w-full max-w-lg">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a workspace..."
          className="w-full rounded-full border border-border bg-card/90 py-3 pl-11 pr-4 text-sm text-foreground shadow-[0_1px_3px_rgba(15,23,42,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2)] backdrop-blur-sm placeholder:text-muted-foreground focus:border-[#5D3FD3]/45 focus:outline-none focus:ring-2 focus:ring-[#5D3FD3]/22"
          aria-label="Find a workspace"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No workspaces match your search.</p>
      ) : (
        <ul className="w-full space-y-3">
          {filtered.map((s) => {
            const slug = s.organization.slug;
            const name = s.organization.name;
            const activeLabel = formatWorkspaceRelativeActive(s.lastActiveAt);
            const pct =
              s.taskTotal > 0 ? Math.min(100, Math.round((s.taskDone / s.taskTotal) * 100)) : 0;

            return (
              <li key={s.id} className="w-full">
                <Link
                  href={`/o/${encodeURIComponent(slug)}`}
                  className={`group block w-full ${workspaceCardClass} overflow-hidden transition-all hover:border-[#5D3FD3]/30 hover:shadow-[0_8px_32px_-8px_rgba(15,23,42,0.14),0_2px_8px_-4px_rgba(15,23,42,0.08)] dark:hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.4),0_2px_8px_-4px_rgba(0,0,0,0.3)]`}
                >
                  <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-5 sm:py-4.5">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#5D3FD3]/10 text-[#5D3FD3]">
                        <FolderPlus className="h-5 w-5" aria-hidden />
                      </div>
                      <span className="truncate text-lg font-semibold text-foreground group-hover:text-[#5D3FD3] transition-colors">
                        {name}
                      </span>
                    </div>
                    {s.role === 'org:admin' ? (
                      <span className="shrink-0 rounded-full bg-[#5D3FD3]/12 px-3 py-1 text-xs font-semibold text-[#5D3FD3] border border-[#5D3FD3]/10">
                        Admin
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-border px-4 py-2.5 sm:px-5 bg-muted/40">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        {activeLabel ?? 'No recent activity'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Users className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                        {s.memberCount} member{s.memberCount === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:flex-initial sm:max-w-[200px]">
                      <span className="text-xs font-semibold text-muted-foreground tabular-nums shrink-0">
                        {s.taskDone} / {s.taskTotal} tasks
                      </span>
                      <div className="h-1.5 min-w-24 flex-1 max-w-[140px] overflow-hidden rounded-full bg-[#5D3FD3]/15 border border-[#5D3FD3]/10">
                        <div
                          className="h-full rounded-full bg-[#5D3FD3] transition-all"
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
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl sm:rounded-2xl border border-dashed border-border bg-card/70 py-4 sm:py-4 text-sm font-semibold text-[#5D3FD3] backdrop-blur-[2px] transition-colors hover:border-[#5D3FD3]/45 hover:bg-[#5D3FD3]/6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)]"
      >
        <span className="text-lg leading-none font-normal">+</span>
        Create another workspace
      </Link>
    </>
  );
}
