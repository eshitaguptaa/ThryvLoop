'use client';

import { Archive, ArchiveRestore, Loader2, Search, X } from 'lucide-react';

/**
 * @param {{
 *   open: boolean,
 *   title?: string,
 *   description?: string,
 *   items: Array<{ id: string, title: string, completedAt?: string | null, subtitle?: string }>,
 *   loading?: boolean,
 *   search: string,
 *   onSearch: (value: string) => void,
 *   onClose: () => void,
 *   onRestore: (id: string) => void | Promise<void>,
 *   restoringId?: string | null,
 * }} props
 */
export default function TaskArchiveDrawer({
  open,
  title = 'Done history',
  description = 'Archived completions stay in Insights for current reports, then older rows are removed so storage stays bounded. Restore one to put it back on the board.',
  items,
  loading = false,
  search,
  onSearch,
  onClose,
  onRestore,
  restoringId = null,
}) {
  if (!open) return null;

  const q = search.trim().toLowerCase();
  const visible = q
    ? items.filter((item) => {
        const hay = `${item.title} ${item.subtitle || ''}`.toLowerCase();
        return hay.includes(q);
      })
    : items;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button type="button" className="flex-1 min-w-0" aria-label="Close" onClick={onClose} />
      <div className="h-full w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col">
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[#5D3FD3] dark:text-[#c4b5fd]">
              <Archive className="h-4 w-4" aria-hidden />
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Archive</p>
            </div>
            <h2 className="mt-1 text-base font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-border shrink-0">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="Search archived tasks"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#5D3FD3]/30"
            />
          </label>
        </div>

        <ul className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <li className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading history…
            </li>
          ) : visible.length === 0 ? (
            <li className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
              {items.length === 0 ? 'Nothing archived yet.' : 'No matches in this history list.'}
            </li>
          ) : (
            visible.map((item) => {
              const busy = restoringId === item.id;
              const when = item.completedAt
                ? new Date(item.completedAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'Completed';
              return (
                <li
                  key={item.id}
                  className="rounded-xl border border-border bg-background/80 px-3 py-3"
                >
                  <p className="text-sm font-medium text-foreground leading-snug">{item.title}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {when}
                    {item.subtitle ? ` · ${item.subtitle}` : ''}
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onRestore(item.id)}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    {busy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ArchiveRestore className="h-3.5 w-3.5" />
                    )}
                    Restore to Done
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
