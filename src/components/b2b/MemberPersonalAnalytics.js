'use client';

import { useMemo } from 'react';
import { workspaceCardClass } from '@/components/b2b/workspaceShellClasses';
import MemberReportDownloadButton from '@/components/b2b/MemberReportDownloadButton';
import {
  MEMBER_REPORT_METRIC_LABELS,
  computeMemberPersonalStats,
} from '@/lib/b2b/memberPersonalStats';

export default function MemberPersonalAnalytics({
  tasks = [],
  focusSessions = [],
  orgTasks = [],
  subjectLabel,
  orgSlug,
  memberUserId,
  showDownload = true,
}) {
  const stats = useMemo(
    () => computeMemberPersonalStats({ tasks, focusSessions, orgTasks }),
    [tasks, focusSessions, orgTasks]
  );

  const cards = MEMBER_REPORT_METRIC_LABELS.map((m) => ({
    label: m.label,
    value: stats[m.key] ?? 0,
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Delivery-first snapshot for <strong className="text-foreground">{subjectLabel}</strong>.
          Verified focus only counts when a personal task is pinned during Focus; raw timer claims do not prove productivity.
        </p>
        {showDownload && orgSlug && memberUserId ? (
          <MemberReportDownloadButton
            orgSlug={orgSlug}
            memberUserId={memberUserId}
            label="Download report"
          />
        ) : null}
      </div>

      {(stats.integrityFlags || []).length > 0 ? (
        <div className="space-y-2">
          {stats.integrityFlags.map((flag) => (
            <div
              key={flag.type}
              className="rounded-xl border border-orange-200 bg-orange-50 dark:bg-orange-950/35 dark:border-orange-500/30 px-3 py-2.5 text-sm text-orange-900 dark:text-orange-100"
            >
              {flag.message}
            </div>
          ))}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className={`${workspaceCardClass} p-4`}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {c.label}
            </p>
            <p className="text-2xl font-bold tabular-nums text-foreground mt-1">{c.value}</p>
          </div>
        ))}
      </div>
      <div className={`${workspaceCardClass} p-4`}>
        <h3 className="text-sm font-semibold text-foreground mb-2">Recent focus sessions</h3>
        {focusSessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No focus sessions in the last 30 days.</p>
        ) : (
          <ul className="divide-y divide-border max-h-64 overflow-y-auto">
            {[...focusSessions]
              .reverse()
              .slice(0, 15)
              .map((s) => {
                return (
                  <li key={s.id || s.completed_at} className="py-2 text-sm flex justify-between gap-2">
                    <span className="text-foreground min-w-0 truncate">
                      {s.completed_at ? new Date(s.completed_at).toLocaleString() : 'Session'}
                    </span>
                    <span className="text-muted-foreground tabular-nums shrink-0">
                      {Math.round((Number(s.duration_seconds) || 0) / 60)} min
                    </span>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </div>
  );
}
