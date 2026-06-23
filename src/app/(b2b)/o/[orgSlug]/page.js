import { Mail, User } from 'lucide-react';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { authModalUrl } from '@/lib/authRoutes';
import {
  workspaceCardClass,
  workspaceContentClass,
  workspaceEyebrowClass,
  workspaceMutedTextClass,
  workspacePageTitleClass,
  workspaceSectionTitleClass,
} from '@/components/b2b/workspaceShellClasses';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getMembershipForSlug, isOrgAdmin } from '@/lib/org';

function formatRelativeAgo(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'Just now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

export default async function OrgWorkspaceHome({ params }) {
  const { userId } = await auth();
  if (!userId) redirect(authModalUrl('signin'));

  const { orgSlug } = await params;
  const membership = await getMembershipForSlug(userId, orgSlug);
  if (!membership) notFound();

  const org = membership.organization;
  const admin = isOrgAdmin(membership);

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.primaryEmailAddress?.emailAddress ?? user.emailAddresses?.[0]?.emailAddress ?? '';
  const first = user.firstName ?? '';
  const last = user.lastName ?? '';
  const profileName =
    `${first} ${last}`.trim()
    || user.username
    || email
    || 'Current user';
  const joined = user.createdAt ? new Date(user.createdAt) : null;
  const joinedLabel = joined
    ? `Joined ${joined.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
    : '';

  const supabase = createSupabaseAdmin();
  const { data: orgRow } = await supabase
    .from('organizations')
    .select('id')
    .eq('clerk_organization_id', org.id)
    .maybeSingle();

  let activeTaskCount = 0;
  let doneLast7 = 0;
  if (orgRow?.id) {
    const { count: active } = await supabase
      .from('organization_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgRow.id)
      .eq('assignee_user_id', userId)
      .neq('column_key', 'done');
    activeTaskCount = active ?? 0;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: doneWeek } = await supabase
      .from('organization_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgRow.id)
      .eq('assignee_user_id', userId)
      .eq('column_key', 'done')
      .gte('completed_at', weekAgo.toISOString());
    doneLast7 = doneWeek ?? 0;
  }

  const lastActive = formatRelativeAgo(user.lastSignInAt ?? null);

  return (
    <div className={workspaceContentClass}>
      <p className={workspaceEyebrowClass}>Overview</p>
      <h1 className={workspacePageTitleClass}>Workspace overview</h1>
      <p className={`${workspaceMutedTextClass} text-sm sm:text-base mt-3 leading-relaxed max-w-2xl`}>
        Team workspace for <strong className="text-foreground font-semibold">{org.name}</strong>.
        {admin
          ? ' Switch between Tasks, Analytics, and Members using the workspace navigation above.'
          : ' Open Tasks or Analytics from the navigation above.'}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)]">
        <section className={`${workspaceCardClass} p-6 sm:p-8`}>
          <h2 className={workspaceSectionTitleClass}>User profile</h2>
          <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex gap-4 min-w-0">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#5D3FD3] text-white shadow-md shadow-indigo-500/25 dark:shadow-indigo-900/40">
                <User className="h-8 w-8 opacity-90" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-semibold text-foreground truncate">{profileName}</p>
                <p className={`text-sm ${workspaceMutedTextClass} mt-0.5`}>{joinedLabel}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#5D3FD3]/10 dark:bg-[#5D3FD3]/20 px-2.5 py-1 text-xs font-semibold text-[#5D3FD3] dark:text-indigo-400">
                    {membership.role}
                  </span>
                  {email ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 dark:bg-sky-950/40 px-2.5 py-1 text-xs font-semibold text-sky-800 dark:text-sky-200 border border-sky-100/80 dark:border-sky-500/30">
                      <Mail className="h-3 w-3 shrink-0" aria-hidden />
                      <span className="truncate max-w-[200px]">{email}</span>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="sm:ml-auto flex sm:justify-end w-full sm:w-auto">
              <div className="rounded-2xl border border-border bg-muted/50 dark:bg-muted/30 px-5 py-4 text-center min-w-[140px] shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#5D3FD3] dark:text-indigo-400">
                  Active tasks
                </p>
                <p className="text-3xl font-bold text-[#5D3FD3] dark:text-indigo-400 mt-1 tabular-nums">{activeTaskCount}</p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Recent completions
              </p>
              <p className="mt-1 font-semibold text-foreground">{doneLast7} in last 7 days</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Last active
              </p>
              <p className="mt-1 font-semibold text-foreground">{lastActive ?? '—'}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Workspace</p>
              <p className="mt-1 font-semibold text-foreground truncate">{org.name}</p>
            </div>
          </div>
        </section>

        <section className={`${workspaceCardClass} p-6 sm:p-7 flex flex-col`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className={workspaceSectionTitleClass}>Recent activity</h2>
          </div>
          <ul className="mt-5 space-y-4 flex-1 text-sm">
            <li className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#5D3FD3]" />
              <div>
                <p className="text-foreground leading-snug">
                  You have{' '}
                  <span className="font-semibold text-foreground">{activeTaskCount}</span> active
                  task{activeTaskCount === 1 ? '' : 's'} in this workspace.
                </p>
                <p className={`text-xs ${workspaceMutedTextClass} mt-1`}>Personal summary</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground/40" />
              <div>
                <p className="text-foreground leading-snug">
                  Open <span className="font-medium text-[#5D3FD3] dark:text-indigo-400">Tasks</span> to move cards across
                  columns; updates sync for your whole team.
                </p>
                <p className={`text-xs ${workspaceMutedTextClass} mt-1`}>Tip</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
              <div>
                <p className="text-foreground leading-snug">
                  {admin
                    ? 'Invite people under Members and assign work from any kanban column.'
                    : 'Ask an admin if you need access to more assignments.'}
                </p>
                <p className={`text-xs ${workspaceMutedTextClass} mt-1`}>Workspace</p>
              </div>
            </li>
          </ul>
          <div className="mt-6 pt-4 border-t border-border">
            <p className={`text-xs text-center ${workspaceMutedTextClass}`}>More activity will appear as your team works.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
