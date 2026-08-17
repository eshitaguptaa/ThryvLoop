'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Focus,
  ListTodo,
  Radio,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  workspacePanelCalm,
  workspacePanelInk,
  workspacePanelRaised,
} from '@/components/b2b/workspaceShellClasses';
import { formatOrgRole } from '@/lib/orgRoles';
import { formatFocusWindowLabel, isWithinFocusHours } from '@/lib/orgPulse';
import { memberLabel } from '@/lib/orgTasks';

function relativeTime(iso) {
  if (!iso) return '';
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (Number.isNaN(sec)) return '';
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

function initials(label) {
  const parts = String(label || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }
  return (parts[0] || '?').slice(0, 2).toUpperCase();
}

function findMember(members, userId) {
  return (members || []).find((m) => m.userId === userId) || null;
}

function enrichRows(rows, members) {
  return (rows || []).map((row) => {
    const m = findMember(members, row.user_id);
    return {
      ...row,
      label: m?.label || memberLabel(members, row.user_id),
      imageUrl: m?.imageUrl ?? null,
    };
  });
}

function PersonOrb({ person, status, size = 'md' }) {
  const dim =
    size === 'lg'
      ? 'h-12 w-12 sm:h-14 sm:w-14 text-sm'
      : size === 'sm'
        ? 'h-8 w-8 text-[10px]'
        : 'h-10 w-10 text-xs';
  const glow =
    status === 'focusing'
      ? 'pulse-avatar-glow--focusing'
      : status === 'available'
        ? 'pulse-avatar-glow--available'
        : 'pulse-avatar-glow--away';

  return (
    <span
      title={person.label}
      className={`relative inline-flex shrink-0 rounded-full ${dim} ${glow}`}
    >
      {person.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.imageUrl}
          alt=""
          className={`${dim} rounded-full object-cover bg-muted`}
        />
      ) : (
        <span
          className={`flex ${dim} items-center justify-center rounded-full bg-slate-200/90 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200`}
          aria-hidden
        >
          {initials(person.label)}
        </span>
      )}
    </span>
  );
}

function VitalMeter({ label, value, hint, icon: Icon, tone = 'brand', share = 0 }) {
  const fill =
    tone === 'rose'
      ? 'bg-rose-500'
      : tone === 'amber'
        ? 'bg-amber-500'
        : tone === 'emerald'
          ? 'bg-emerald-500'
          : tone === 'sky'
            ? 'bg-sky-500'
            : 'bg-[#5D3FD3]';
  const valueClass =
    tone === 'rose' && value > 0
      ? 'text-rose-600 dark:text-rose-400'
      : 'text-foreground';

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5 truncate">
          <Icon className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
          {label}
        </p>
        <p className={`text-xl sm:text-2xl font-bold tabular-nums tracking-tight ${valueClass}`}>
          {value}
        </p>
      </div>
      <div className="h-1 rounded-full bg-slate-200/80 dark:bg-white/10 overflow-hidden">
        <div
          className={`pulse-vital-fill h-full rounded-full ${fill}`}
          style={{ width: `${Math.max(4, Math.min(100, share * 100))}%` }}
        />
      </div>
      <p className="mt-1.5 text-[10px] text-muted-foreground truncate">{hint}</p>
    </div>
  );
}

export default function OrgPulseDashboard({
  orgName,
  orgSlug,
  isAdmin,
  role,
  pulse,
  activity,
  presence,
  members,
  focusHours,
  insightsPolicy,
}) {
  const reduceMotion = useReducedMotion();
  const base = `/o/${encodeURIComponent(orgSlug)}`;
  const inFocusWindow = isWithinFocusHours(focusHours);
  const fullTransparency = insightsPolicy === 'full_individual';

  const focusing = enrichRows(presence?.focusing, members);
  const available = enrichRows(presence?.available, members);
  const away = enrichRows(presence?.away, members);
  const liveCount = focusing.length + available.length + away.length;
  const needs = [
    pulse.overdueCount > 0
      ? { key: 'overdue', label: `${pulse.overdueCount} overdue`, href: `${base}/work`, tone: 'rose' }
      : null,
    isAdmin && pulse.unassignedCount > 0
      ? {
          key: 'unassigned',
          label: `${pulse.unassignedCount} unassigned`,
          href: `${base}/work`,
          tone: 'amber',
        }
      : null,
    pulse.overloaded?.length
      ? {
          key: 'load',
          label: `${pulse.overloaded.length} overloaded`,
          href: `${base}/people`,
          tone: 'orange',
        }
      : null,
    pulse.dueTodayCount > 0
      ? {
          key: 'due',
          label: `${pulse.dueTodayCount} due today`,
          href: `${base}/work`,
          tone: 'violet',
        }
      : null,
  ].filter(Boolean);

  const toneClass = {
    rose: 'bg-rose-500/12 text-rose-800 border-rose-300/50 dark:text-rose-200 dark:border-rose-500/30',
    amber:
      'bg-amber-500/12 text-amber-900 border-amber-300/50 dark:text-amber-100 dark:border-amber-500/30',
    orange:
      'bg-orange-500/12 text-orange-900 border-orange-300/50 dark:text-orange-100 dark:border-orange-500/30',
    violet:
      'bg-[#5D3FD3]/12 text-[#5D3FD3] border-[#5D3FD3]/25 dark:text-[#c4b5fd]',
  };

  const denom = Math.max(pulse.openCount || 0, 1);
  const doneDenom = Math.max(pulse.openCount + pulse.doneThisWeekCount, 1);

  const fadeUp = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
      };

  const stagger = (i) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 10 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.08 + i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
        };

  return (
    <div className="w-full min-w-0 space-y-5 sm:space-y-6">
      {/* —— Live hero —— */}
      <motion.section
        {...fadeUp}
        className={`pulse-hero relative overflow-hidden rounded-2xl border border-teal-200/60 dark:border-teal-500/20 ${workspacePanelRaised} dark:bg-[#0d1524]/90`}
      >
        <div
          className="pointer-events-none absolute -top-28 -left-16 h-72 w-72 rounded-full blur-3xl pulse-hero-orb--a"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-10 h-80 w-80 rounded-full blur-3xl pulse-hero-orb--b"
          aria-hidden
        />

        <div className="relative z-[1] p-5 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-10">
            {/* Heartbeat */}
            <div className="relative mx-auto lg:mx-0 flex h-40 w-40 sm:h-44 sm:w-44 shrink-0 items-center justify-center">
              <span
                className="pulse-beat-ring absolute inset-2 rounded-full"
                aria-hidden
              />
              <span
                className="pulse-beat-ring pulse-beat-ring--delayed absolute inset-0 rounded-full"
                aria-hidden
              />
              <div className="relative flex h-[7.5rem] w-[7.5rem] sm:h-32 sm:w-32 flex-col items-center justify-center rounded-full border border-teal-300/50 bg-white/70 shadow-inner dark:border-teal-500/25 dark:bg-[#0a1220]/80">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
                  Focusing
                </p>
                <p className="mt-0.5 text-4xl sm:text-5xl font-bold tabular-nums tracking-tight text-foreground leading-none">
                  {focusing.length}
                </p>
                <p className="mt-1.5 text-[11px] text-muted-foreground tabular-nums">
                  {liveCount} live
                </p>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2.5">
                <span className="h-px w-5 bg-[#5D3FD3]/80" aria-hidden />
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5D3FD3] dark:text-[#a89bf5]">
                  Pulse
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/60 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:border-emerald-500/30 dark:text-emerald-300">
                  <span
                    className="pulse-live-dot h-1.5 w-1.5 rounded-full bg-emerald-500"
                    aria-hidden
                  />
                  Live
                </span>
                {focusHours?.enabled ? (
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      inFocusWindow
                        ? 'border-teal-300/70 bg-teal-500/10 text-teal-800 dark:border-teal-500/30 dark:text-teal-300'
                        : 'border-border bg-muted/50 text-muted-foreground'
                    }`}
                  >
                    <Focus className="h-3 w-3" aria-hidden />
                    {inFocusWindow ? 'Focus hours' : 'Outside hours'}
                  </span>
                ) : null}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-[1.12]">
                {orgName}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">
                Live team state · {formatOrgRole(role)}
                {fullTransparency ? (
                  <span className="text-sky-700 dark:text-sky-300"> · Full transparency</span>
                ) : null}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {needs.length > 0 ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Zap className="h-3.5 w-3.5 text-amber-500" aria-hidden />
                      Attention
                    </span>
                    {needs.map((n) => (
                      <Link
                        key={n.key}
                        href={n.href}
                        className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold transition-transform hover:-translate-y-px ${toneClass[n.tone]}`}
                      >
                        {n.label}
                      </Link>
                    ))}
                  </>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    Clear skies — nothing urgent
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Vitals */}
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 border-t border-border/70 dark:border-white/[0.06] pt-5">
            <VitalMeter
              label="Open work"
              value={pulse.openCount}
              hint={`${pulse.inProgressCount} in progress`}
              icon={ListTodo}
              tone="brand"
              share={pulse.openCount / Math.max(pulse.openCount + pulse.doneThisWeekCount, 1)}
            />
            <VitalMeter
              label="Due today"
              value={pulse.dueTodayCount}
              hint="Shared commitments"
              icon={Clock}
              tone="sky"
              share={pulse.dueTodayCount / denom}
            />
            <VitalMeter
              label="Overdue"
              value={pulse.overdueCount}
              hint={isAdmin ? `${pulse.unassignedCount} unassigned` : 'On your plate'}
              icon={AlertTriangle}
              tone="rose"
              share={pulse.overdueCount / denom}
            />
            <VitalMeter
              label="Shipped this week"
              value={pulse.doneThisWeekCount}
              hint="Completions"
              icon={CheckCircle2}
              tone="emerald"
              share={pulse.doneThisWeekCount / doneDenom}
            />
          </div>
        </div>
      </motion.section>

      {/* —— Presence + Activity —— */}
      {/*
        Presence sets the row height. Activity uses h-0/min-h-full so its content
        does not grow the row — it fills Presence height and scrolls inside.
      */}
      <div className="grid gap-5 lg:grid-cols-12 lg:items-stretch">
        <motion.section
          {...stagger(1)}
          className={`${workspacePanelCalm} pulse-presence-stage p-5 sm:p-6 lg:col-span-7`}
        >
          <div className="flex items-end justify-between gap-3 mb-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-700/80 dark:text-teal-300/90">
                Right now
              </p>
              <h2 className="text-lg font-semibold text-foreground mt-0.5 tracking-tight">
                Presence field
              </h2>
            </div>
            <Link
              href={`${base}/rhythm`}
              className="text-xs font-semibold text-teal-800 dark:text-teal-300 hover:underline inline-flex items-center gap-1"
            >
              Full rhythm
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                <p className="text-xs font-semibold text-foreground">
                  Deep work · {focusing.length}
                </p>
              </div>
              {focusing.length === 0 ? (
                <p className="text-sm text-muted-foreground pl-4 border-l-2 border-teal-200/80 dark:border-teal-500/25">
                  Nobody in focus yet — the field is quiet.
                </p>
              ) : (
                <ul className="flex flex-wrap gap-3 sm:gap-4">
                  {focusing.map((person, i) => (
                    <motion.li
                      key={person.user_id}
                      {...(reduceMotion
                        ? {}
                        : {
                            initial: { opacity: 0, scale: 0.85 },
                            animate: { opacity: 1, scale: 1 },
                            transition: { delay: 0.12 + i * 0.04 },
                          })}
                      className="flex flex-col items-center gap-1.5 w-[4.5rem] sm:w-20"
                    >
                      <PersonOrb person={person} status="focusing" size="lg" />
                      <span className="text-[11px] font-medium text-foreground text-center line-clamp-2 leading-tight">
                        {person.label}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-5 pt-1">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-2 w-2 rounded-full bg-sky-500" aria-hidden />
                  <p className="text-xs font-semibold text-foreground">
                    Available · {available.length}
                  </p>
                </div>
                {available.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No online signals</p>
                ) : (
                  <ul className="flex flex-wrap gap-2.5">
                    {available.slice(0, 10).map((person) => (
                      <li key={person.user_id} className="flex items-center gap-2 min-w-0">
                        <PersonOrb person={person} status="available" size="sm" />
                        <span className="text-xs font-medium text-foreground truncate max-w-[7rem]">
                          {person.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden />
                  <p className="text-xs font-semibold text-foreground">Away · {away.length}</p>
                </div>
                {away.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No one away</p>
                ) : (
                  <ul className="flex flex-wrap gap-2.5">
                    {away.slice(0, 8).map((person) => (
                      <li key={person.user_id} className="flex items-center gap-2 min-w-0 opacity-80">
                        <PersonOrb person={person} status="away" size="sm" />
                        <span className="text-xs font-medium text-foreground truncate max-w-[7rem]">
                          {person.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {focusHours?.enabled && focusHours.windows?.length ? (
              <div className="pt-4 border-t border-teal-200/60 dark:border-teal-500/20">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2">
                  Focus windows
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {focusHours.windows.map((w, i) => (
                    <span
                      key={`${w.day}-${w.start}-${i}`}
                      className="rounded-md border border-teal-200/70 bg-white/50 px-2 py-0.5 text-[11px] text-teal-900/80 dark:border-teal-500/25 dark:bg-teal-950/30 dark:text-teal-200/90"
                    >
                      {formatFocusWindowLabel(w)}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </motion.section>

        <div className="max-h-[28rem] min-h-0 lg:col-span-5 lg:h-0 lg:max-h-none lg:min-h-full">
          <motion.section
            {...stagger(2)}
            className={`${workspacePanelInk} flex h-full max-h-full min-h-0 flex-col overflow-hidden p-5 sm:p-6`}
          >
            <div className="mb-5 flex shrink-0 items-end justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  Stream
                </p>
                <h2 className="mt-0.5 flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
                  <Radio className="h-4 w-4 text-[#5D3FD3]" aria-hidden />
                  Activity
                </h2>
              </div>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {activity?.length || 0} events
              </span>
            </div>

            {activity?.length ? (
              <div className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain pl-1 pr-1">
                <div
                  className="pulse-stream-line pointer-events-none absolute bottom-2 left-[7px] top-2 w-px"
                  aria-hidden
                />
                <ul className="space-y-0.5">
                  {activity.map((ev, i) => (
                    <li key={ev.id} className="pulse-stream-item relative flex gap-3 py-2.5 pl-0.5">
                      <span
                        className="relative z-[1] mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#5D3FD3] ring-4 ring-slate-50 dark:ring-slate-900/80"
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-foreground">{ev.summary}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {memberLabel(members, ev.actor_user_id)}
                          <span className="mx-1.5 text-border">·</span>
                          {relativeTime(ev.created_at)}
                        </p>
                      </div>
                      {!reduceMotion && i === 0 ? (
                        <span className="mt-0.5 shrink-0 self-start">
                          <Sparkles className="h-3.5 w-3.5 text-[#5D3FD3]/70" aria-hidden />
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/20 px-3 text-center">
                <Radio className="mb-3 h-8 w-8 text-muted-foreground/35" aria-hidden />
                <p className="text-sm font-medium text-foreground">Waiting for the first signal</p>
                <p className="mt-1 max-w-[16rem] text-xs leading-relaxed text-muted-foreground">
                  Moves on Work and team actions will light up this stream.
                </p>
              </div>
            )}
          </motion.section>
        </div>
      </div>

      {/* —— Commitments —— */}
      {(pulse.dueTodayTasks?.length > 0 || pulse.overdueTasks?.length > 0) && (
        <motion.section
          {...stagger(3)}
          className={`${workspacePanelRaised} pulse-commit-rail overflow-hidden`}
        >
          <div className="p-5 sm:p-6">
            <div className="flex items-end justify-between gap-3 mb-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Commitments
                </p>
                <h2 className="text-lg font-semibold text-foreground mt-0.5 tracking-tight">
                  Due & overdue
                </h2>
              </div>
              <Link
                href={`${base}/work`}
                className="text-xs font-semibold text-[#5D3FD3] dark:text-[#c4b5fd] hover:underline inline-flex items-center gap-1"
              >
                Board
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 mb-2.5 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  Due today
                </p>
                <ul className="space-y-2">
                  {(pulse.dueTodayTasks || []).map((t) => (
                    <li
                      key={t.id}
                      className="group flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-background/70 px-3.5 py-2.5 dark:bg-white/[0.03]"
                    >
                      <span className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-[#5D3FD3] transition-colors">
                        {t.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {memberLabel(members, t.assignee_user_id)}
                      </span>
                    </li>
                  ))}
                  {!pulse.dueTodayTasks?.length ? (
                    <li className="text-sm text-muted-foreground py-1">None on the clock</li>
                  ) : null}
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 mb-2.5 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
                  Overdue
                </p>
                <ul className="space-y-2">
                  {(pulse.overdueTasks || []).map((t) => (
                    <li
                      key={t.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-rose-200/70 bg-rose-50/50 px-3.5 py-2.5 dark:border-rose-500/25 dark:bg-rose-950/25"
                    >
                      <span className="font-medium text-sm text-foreground line-clamp-1">
                        {t.title}
                      </span>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {memberLabel(members, t.assignee_user_id)}
                      </span>
                    </li>
                  ))}
                  {!pulse.overdueTasks?.length ? (
                    <li className="text-sm text-muted-foreground py-1">Nothing slipping</li>
                  ) : null}
                </ul>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </div>
  );
}
