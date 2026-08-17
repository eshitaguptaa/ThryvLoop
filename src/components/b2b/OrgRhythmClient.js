'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Settings2 } from 'lucide-react';
import {
  workspacePanelHero,
  workspacePanelRaised,
} from '@/components/b2b/workspaceShellClasses';
import WorkspacePageHeader from '@/components/b2b/WorkspacePageHeader';
import {
  formatFocusWindowLabel,
  isWithinFocusHours,
  parseFocusHours,
  PRESENCE_STALE_MS,
} from '@/lib/orgPulse';
import {
  buildOrgPresenceRoster,
  PRESENCE_STATUS_META,
  writePresencePref,
} from '@/lib/orgPresence';
import { useTimer } from '@/contexts/TimerContext';
import { useFocusSession } from '@/contexts/FocusSessionContext';
import { getSupabaseClient, setSupabaseAuthToken } from '@/utils/userStorage';

const STATUS_OPTS = [
  { id: 'focusing', label: 'Focusing' },
  { id: 'available', label: 'Available' },
  { id: 'away', label: 'Away' },
];

const SECTION_ORDER = ['focusing', 'available', 'away', 'offline'];

function memberInitials(label) {
  const parts = String(label || '?')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }
  return (parts[0] || '?').slice(0, 2).toUpperCase();
}

function PresenceAvatar({ person, isMe }) {
  const meta = PRESENCE_STATUS_META[person.status] || PRESENCE_STATUS_META.offline;
  return (
    <span className="relative inline-flex h-9 w-9 shrink-0">
      {person.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.imageUrl}
          alt=""
          className="h-9 w-9 rounded-full object-cover bg-muted ring-2 ring-background"
        />
      ) : (
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground ring-2 ring-background"
          aria-hidden
        >
          {memberInitials(person.label)}
        </span>
      )}
      <span
        title={meta.label}
        className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${meta.dot}`}
        aria-hidden
      />
      {isMe ? (
        <span className="sr-only">You</span>
      ) : null}
    </span>
  );
}

/**
 * @param {{
 *   person: ReturnType<typeof buildOrgPresenceRoster>['people'][number],
 *   isMe: boolean,
 * }} props
 */
function PresenceRow({ person, isMe }) {
  const meta = PRESENCE_STATUS_META[person.status] || PRESENCE_STATUS_META.offline;
  const isAdminRole = /admin/i.test(person.roleLabel || '');
  return (
    <li
      className={`flex items-center gap-3 rounded-xl px-2.5 py-2 ${
        isMe ? 'bg-[rgba(93,63,211,0.06)] dark:bg-[rgba(93,63,211,0.12)]' : 'hover:bg-muted/40'
      }`}
    >
      <PresenceAvatar person={person} isMe={isMe} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-foreground">
            {person.label}
            {isMe ? <span className="font-medium text-muted-foreground"> (you)</span> : null}
          </span>
          {isAdminRole ? (
            <span className="shrink-0 rounded-md border border-border/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Admin
            </span>
          ) : null}
        </div>
        <p className={`text-[11px] font-medium ${meta.badge}`}>{meta.label}</p>
      </div>
    </li>
  );
}

export default function OrgRhythmClient({
  organizationId,
  orgName,
  orgSlug,
  isAdmin,
  members,
  focusHours: initialFocus,
  currentUserId,
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { isRunning } = useTimer();
  const { sessionActive } = useFocusSession();
  const focusingNow = Boolean(sessionActive || isRunning);
  const focusHours = parseFocusHours(initialFocus);
  const inWindow = isWithinFocusHours(focusHours);
  const [rows, setRows] = useState([]);
  const [myStatus, setMyStatus] = useState('available');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const myStatusRef = useRef(myStatus);
  myStatusRef.current = myStatus;

  const roster = useMemo(
    () => buildOrgPresenceRoster(members, rows),
    [members, rows]
  );

  const loadPresence = useCallback(async () => {
    if (!organizationId) return;
    const token = await getToken({ template: 'supabase' });
    if (!token) return;
    setSupabaseAuthToken(token);
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { data, error: err } = await supabase
      .from('organization_presence')
      .select('user_id, status, last_seen_at, note')
      .eq('organization_id', organizationId);
    if (err) {
      setError(err.message);
      return;
    }
    setRows(data || []);
    const mine = (data || []).find((r) => r.user_id === currentUserId);
    if (mine) {
      const seen = mine.last_seen_at ? new Date(mine.last_seen_at).getTime() : 0;
      const stale = !seen || Date.now() - seen > PRESENCE_STALE_MS;
      if (!stale && mine.status) setMyStatus(mine.status);
    }
  }, [organizationId, getToken, currentUserId]);

  const upsertPresence = useCallback(
    async (status, { asPref = true } = {}) => {
      if (!organizationId || !currentUserId) return;
      const token = await getToken({ template: 'supabase' });
      if (!token) return;
      setSupabaseAuthToken(token);
      const supabase = getSupabaseClient();
      if (!supabase) return;
      const now = new Date().toISOString();
      if (asPref) writePresencePref(organizationId, currentUserId, status);
      await supabase.from('organization_presence').upsert(
        {
          organization_id: organizationId,
          user_id: currentUserId,
          status,
          last_seen_at: now,
          updated_at: now,
        },
        { onConflict: 'organization_id,user_id' }
      );
      setMyStatus(status);
      await loadPresence();
    },
    [organizationId, getToken, currentUserId, loadPresence]
  );

  // Mirror Focus session into presence when it starts/stops on this page
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !organizationId) return;
    if (focusingNow) {
      void upsertPresence('focusing');
      return;
    }
    if (myStatusRef.current === 'focusing') {
      void upsertPresence('available');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to session only
  }, [focusingNow, isLoaded, isSignedIn, organizationId]);

  // Peer refresh (Teams-like freshness)
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !organizationId) return undefined;
    void loadPresence();
    const poll = setInterval(() => {
      void loadPresence();
    }, 15_000);
    return () => clearInterval(poll);
  }, [isLoaded, isSignedIn, organizationId, loadPresence]);

  const setManual = async (status) => {
    setSaving(true);
    setError('');
    try {
      await upsertPresence(status);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update presence');
    }
    setSaving(false);
  };

  const scheduleLink = `/o/${encodeURIComponent(orgSlug)}/settings`;

  const orderedSections = SECTION_ORDER.map((key) => ({
    key,
    meta: PRESENCE_STATUS_META[key],
    people: roster.groups[key] || [],
  }));

  const onlineCount =
    (roster.groups.focusing?.length || 0)
    + (roster.groups.available?.length || 0)
    + (roster.groups.away?.length || 0);

  return (
    <div className="space-y-5 w-full min-w-0">
      <WorkspacePageHeader
        eyebrow="Rhythm"
        title={orgName}
        description="Team online, focusing, or offline — live presence for this workspace."
        actions={
          isAdmin ? (
            <Link
              href={scheduleLink}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors"
            >
              <Settings2 className="h-3.5 w-3.5" aria-hidden />
              Schedule
            </Link>
          ) : null
        }
      />

      <section className={`${workspacePanelRaised} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5 border-b border-border/70 dark:border-white/[0.06]">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Focus blocks
            </p>
            <p className="text-sm font-semibold text-foreground mt-0.5">
              {focusHours.enabled ? focusHours.timezone.replace(/_/g, ' ') : 'Off'}
            </p>
          </div>
          {focusHours.enabled ? (
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                inWindow
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/25'
                  : 'bg-muted text-muted-foreground ring-1 ring-border'
              }`}
            >
              {inWindow ? 'Live now' : 'Outside hours'}
            </span>
          ) : null}
        </div>
        <div className="px-4 py-3 sm:px-5">
          {focusHours.enabled && focusHours.windows?.length ? (
            <div className="flex flex-wrap gap-1.5">
              {focusHours.windows.map((w, i) => (
                <span
                  key={`${w.day}-${w.start}-${w.end}-${i}`}
                  className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground dark:bg-white/[0.04]"
                >
                  {formatFocusWindowLabel(w)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isAdmin ? (
                <Link href={scheduleLink} className="font-semibold text-[#5D3FD3] hover:underline">
                  Set schedule
                </Link>
              ) : (
                'No shared schedule yet'
              )}
            </p>
          )}
        </div>
      </section>

      <section className={`${workspacePanelHero} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-sm font-semibold text-foreground">Your status</h2>
          <span className="text-xs font-medium capitalize text-muted-foreground">{myStatus}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_OPTS.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={saving}
              onClick={() => void setManual(s.id)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold border transition-colors ${
                myStatus === s.id
                  ? 'bg-[#5D3FD3] text-white border-[#5D3FD3] shadow-sm'
                  : 'border-border bg-card hover:bg-muted text-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Focusing also updates when your focus timer is running.
        </p>
        {error ? <p className="text-sm text-rose-600 mt-3">{error}</p> : null}
      </section>

      <section className={`${workspacePanelRaised} overflow-hidden`}>
        <div className="flex flex-wrap items-end justify-between gap-2 border-b border-border/70 px-4 py-3.5 sm:px-5 dark:border-white/[0.06]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Team
            </p>
            <h2 className="text-base font-semibold text-foreground mt-0.5">Status</h2>
          </div>
          <p className="text-xs text-muted-foreground tabular-nums">
            <span className="font-semibold text-foreground">{onlineCount}</span>
            {' '}
            online ·
            {' '}
            <span className="font-semibold text-foreground">{roster.people.length}</span>
            {' '}
            in team
          </p>
        </div>

        {!organizationId ? (
          <p className="px-4 py-8 text-sm text-muted-foreground text-center">
            Workspace not linked for presence yet.
          </p>
        ) : (
          <div className="divide-y divide-border/70 dark:divide-white/[0.06]">
            {orderedSections.map((section) => (
              <div key={section.key} className="px-3 py-3 sm:px-4">
                <h3 className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <span className={`h-1.5 w-1.5 rounded-full ${section.meta.dot}`} aria-hidden />
                  {section.meta.label}
                  <span className="ml-auto tabular-nums text-foreground/70">
                    {section.people.length}
                  </span>
                </h3>
                {section.people.length === 0 ? (
                  <p className="px-1 py-1 text-xs text-muted-foreground/80">No one</p>
                ) : (
                  <ul className="space-y-0.5">
                    {section.people.map((person) => (
                      <PresenceRow
                        key={person.userId}
                        person={person}
                        isMe={person.userId === currentUserId}
                      />
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
