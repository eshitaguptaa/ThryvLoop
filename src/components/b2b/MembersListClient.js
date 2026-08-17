'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronDown, Search } from 'lucide-react';
import { removeMember, updateMemberRole } from '@/app/(b2b)/o/actions';
import ConfirmModal from '@/components/ui/ConfirmModal';
import MemberReportDownloadButton from '@/components/b2b/MemberReportDownloadButton';
import {
  workspaceCardClass,
  workspaceMenuItemClass,
  workspaceMenuItemDangerClass,
  workspaceMenuPanelClass,
} from '@/components/b2b/workspaceShellClasses';
import { formatOrgRole, canAccessMemberPersonalReport } from '@/lib/orgRoles';

function memberDisplayName(m) {
  const first = m.publicUserData?.firstName || '';
  const last = m.publicUserData?.lastName || '';
  const name = `${first} ${last}`.trim();
  const email =
    m.publicUserData?.identifier
    || m.publicUserData?.emailAddress
    || m.publicUserData?.userId
    || 'Member';
  return { name: name || email, email: email !== name ? email : null };
}

function initials(name, fallback) {
  const n = (name || '').trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  }
  return (fallback || '?').slice(0, 2).toUpperCase();
}

function memberRowColors(i) {
  const palette = [
    'bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200',
    'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200',
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
    'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200',
    'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200',
  ];
  return palette[i % palette.length];
}

export default function MembersListClient({
  members,
  title,
  orgSlug,
  isAdmin,
  currentUserId,
  workload = {},
  insightsPolicy = 'team_only',
  highlightUserId = '',
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const [highlightOn, setHighlightOn] = useState(Boolean(highlightUserId));
  const [removeTarget, setRemoveTarget] = useState(null);

  useEffect(() => {
    if (!highlightUserId) {
      setHighlightOn(false);
      return undefined;
    }
    setHighlightOn(true);
    const timer = window.setTimeout(() => {
      setHighlightOn(false);
      router.replace(`/o/${encodeURIComponent(orgSlug)}/people`, { scroll: false });
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [highlightUserId, orgSlug, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const { name, email } = memberDisplayName(m);
      return (
        name.toLowerCase().includes(q)
        || (email && email.toLowerCase().includes(q))
        || (m.publicUserData?.userId || '').toLowerCase().includes(q)
      );
    });
  }, [members, query]);

  const runRole = (userId, role) => {
    setMessage('');
    startTransition(async () => {
      const res = await updateMemberRole(orgSlug, userId, role);
      setMessage(res?.error || 'Role updated.');
      setOpenMenuId(null);
    });
  };

  const runRemove = (userId, label) => {
    setOpenMenuId(null);
    setRemoveTarget({ userId, label });
  };

  const confirmRemove = () => {
    if (!removeTarget) return;
    setMessage('');
    startTransition(async () => {
      const res = await removeMember(orgSlug, removeTarget.userId);
      setMessage(res?.error || 'Member removed.');
      setRemoveTarget(null);
    });
  };

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between mb-4">
        {title ? (
          <h2 className="text-base font-semibold text-foreground shrink-0 tracking-tight">{title}</h2>
        ) : null}
        <div className="relative w-full lg:max-w-sm lg:ml-auto">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people…"
            className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#5D3FD3]/35 focus:outline-none focus:ring-2 focus:ring-[#5D3FD3]/20"
            aria-label="Search people"
          />
        </div>
      </div>

      {message ? (
        <p className="mb-3 text-sm text-muted-foreground rounded-lg border border-border bg-muted/40 px-3 py-2">
          {message}
        </p>
      ) : null}

      {filtered.length > 0 ? (
        <div className={`${workspaceCardClass} overflow-hidden ws-rise`}>
          <ul className="divide-y divide-border/70">
            {filtered.map((m, i) => {
              const { name, email } = memberDisplayName(m);
              const userId = m.publicUserData?.userId;
              const roleLabel = formatOrgRole(m.role);
              const load = workload[userId] || { open: 0, dueThisWeek: 0 };
              const canManage = isAdmin && userId && userId !== currentUserId;
              const reportAccess = canAccessMemberPersonalReport({
                viewerIsAdmin: Boolean(isAdmin),
                viewerUserId: currentUserId,
                subjectUserId: userId,
                subjectRole: m.role,
                insightsPolicy,
              });
              // Download / profile for peers only when admin + full transparency (helper includes self).
              const canDownloadReport = Boolean(userId && reportAccess);
              const canOpenProfile = Boolean(userId && reportAccess);
              const profileHref = `/o/${encodeURIComponent(orgSlug)}/people/${encodeURIComponent(userId || '')}`;

              return (
                <li
                  key={m.id}
                  className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-muted/30 ${
                    highlightOn && userId && userId === highlightUserId ? 'people-row-joined' : ''
                  }`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${memberRowColors(i)}`}
                    >
                      {initials(name, email || userId)}
                    </div>
                    <div className="min-w-0">
                      {canOpenProfile ? (
                        <Link
                          href={profileHref}
                          className="text-sm font-semibold text-foreground truncate hover:text-[#5D3FD3] transition-colors block"
                        >
                          {name}
                          {userId === currentUserId ? (
                            <span className="ml-1.5 text-[11px] font-medium text-muted-foreground">
                              you
                            </span>
                          ) : null}
                          {highlightOn && userId && userId === highlightUserId ? (
                            <span className="ml-1.5 text-[11px] font-semibold text-[#5D3FD3] dark:text-[#c4b5fd]">
                              just joined
                            </span>
                          ) : null}
                        </Link>
                      ) : (
                        <p className="text-sm font-semibold text-foreground truncate">
                          {name}
                          {userId === currentUserId ? (
                            <span className="ml-1.5 text-[11px] font-medium text-muted-foreground">
                              you
                            </span>
                          ) : null}
                          {highlightOn && userId && userId === highlightUserId ? (
                            <span className="ml-1.5 text-[11px] font-semibold text-[#5D3FD3] dark:text-[#c4b5fd]">
                              just joined
                            </span>
                          ) : null}
                        </p>
                      )}
                      {email ? (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{email}</p>
                      ) : null}
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {load.open} open · {load.dueThisWeek} due this week
                        {load.open >= 5 ? (
                          <span className="ml-1 text-amber-700 dark:text-amber-300 font-semibold">
                            · Heavy
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {canDownloadReport ? (
                      <MemberReportDownloadButton
                        orgSlug={orgSlug}
                        memberUserId={userId}
                        size="sm"
                        label="Download report"
                      />
                    ) : null}

                    {canManage ? (
                      <div className="relative">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => setOpenMenuId((id) => (id === m.id ? null : m.id))}
                          className="flex h-9 items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-sm hover:border-[#5D3FD3]/30 hover:bg-muted/40 transition-colors disabled:opacity-50"
                        >
                          {roleLabel}
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden />
                        </button>
                        {openMenuId === m.id ? (
                          <div className={`${workspaceMenuPanelClass} right-0 w-48`} role="menu">
                            {m.role !== 'org:admin' ? (
                              <button
                                type="button"
                                className={workspaceMenuItemClass}
                                role="menuitem"
                                onClick={() => runRole(userId, 'org:admin')}
                              >
                                Make admin
                              </button>
                            ) : (
                              <button
                                type="button"
                                className={workspaceMenuItemClass}
                                role="menuitem"
                                onClick={() => runRole(userId, 'org:member')}
                              >
                                Make member
                              </button>
                            )}
                            <div className="my-1 border-t border-border dark:border-white/10" />
                            <button
                              type="button"
                              className={workspaceMenuItemDangerClass}
                              role="menuitem"
                              onClick={() => runRemove(userId, name)}
                            >
                              Remove from workspace
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="flex h-9 items-center rounded-xl border border-border bg-muted/40 px-3 text-xs font-semibold text-muted-foreground">
                        {roleLabel}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className={`${workspaceCardClass} px-5 py-10 text-center text-sm text-muted-foreground`}>
          {members.length > 0 ? 'No people match your search.' : 'No members in this workspace yet.'}
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(removeTarget)}
        title="Remove this member?"
        description={
          removeTarget ? (
            <>
              <span className="font-semibold text-foreground">{removeTarget.label}</span>
              {' '}will lose access to this workspace. You can invite them again later if needed.
            </>
          ) : (
            'They will lose access to this workspace.'
          )
        }
        confirmLabel={pending ? 'Removing…' : 'Remove member'}
        cancelLabel="Keep member"
        tone="danger"
        busy={pending}
        busyLabel="Removing…"
        onCancel={() => {
          if (pending) return;
          setRemoveTarget(null);
        }}
        onConfirm={confirmRemove}
      />
    </>
  );
}
