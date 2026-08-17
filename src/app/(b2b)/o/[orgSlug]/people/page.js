import Link from 'next/link';
import { Mail } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { authModalUrl } from '@/lib/authRoutes';
import InviteMemberForm from '@/components/b2b/InviteMemberForm';
import MembersListClient from '@/components/b2b/MembersListClient';
import ResendInviteButton from '@/components/b2b/ResendInviteButton';
import RevokeInviteButton from '@/components/b2b/RevokeInviteButton';
import WorkspacePageHeader from '@/components/b2b/WorkspacePageHeader';
import {
  workspaceCardClass,
  workspaceMutedLinkClass,
  workspaceSectionTitleClass,
} from '@/components/b2b/workspaceShellClasses';
import {
  getOrgMembers,
  getPendingInvitations,
  getWorkspaceContext,
  isOrgAdmin,
} from '@/lib/org';
import { plainOrgMembersForClient } from '@/lib/orgMembersPlain';
import { formatOrgRole } from '@/lib/orgRoles';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';

function formatInvitedAgo(createdAt) {
  if (!createdAt) return '';
  const d =
    createdAt instanceof Date
      ? createdAt
      : typeof createdAt === 'number'
        ? new Date(createdAt)
        : new Date(createdAt);
  if (Number.isNaN(d.getTime())) return '';
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days <= 0) return 'Invited today';
  if (days === 1) return 'Invited yesterday';
  return `Invited ${days} days ago`;
}

export default async function PeoplePage({ params }) {
  const { userId } = await auth();
  if (!userId) redirect(authModalUrl('signin'));

  const { orgSlug } = await params;
  const ctx = await getWorkspaceContext(userId, orgSlug);
  if (!ctx) notFound();

  const admin = isOrgAdmin(ctx.membership);
  const [members, invitations] = await Promise.all([
    getOrgMembers(ctx.clerkOrgId),
    admin ? getPendingInvitations(ctx.clerkOrgId) : Promise.resolve([]),
  ]);

  const memberRows = plainOrgMembersForClient(members);
  /** @type {Record<string, { open: number, dueThisWeek: number }>} */
  const workload = {};

  if (ctx.supabaseOrgId) {
    const supabase = createSupabaseAdmin();
    const { data: tasks } = await supabase
      .from('organization_tasks')
      .select('assignee_user_id, column_key, due_date')
      .eq('organization_id', ctx.supabaseOrgId)
      .neq('column_key', 'done');

    const weekEnd = new Date();
    weekEnd.setDate(weekEnd.getDate() + (7 - weekEnd.getDay()));
    weekEnd.setHours(23, 59, 59, 999);
    const now = new Date();

    (tasks || []).forEach((t) => {
      if (!t.assignee_user_id || t.column_key === 'done') return;
      if (!workload[t.assignee_user_id]) {
        workload[t.assignee_user_id] = { open: 0, dueThisWeek: 0 };
      }
      workload[t.assignee_user_id].open += 1;
      if (t.due_date) {
        const d = new Date(t.due_date);
        if (d >= now && d <= weekEnd) workload[t.assignee_user_id].dueThisWeek += 1;
      }
    });
  }

  return (
    <div className="w-full min-w-0 space-y-5">
      <WorkspacePageHeader
        eyebrow="People"
        title="Team"
        description={`Members and workload for ${ctx.name}.`}
      />

      {admin ? <InviteMemberForm orgSlug={ctx.slug} /> : null}

      {!admin ? (
        <p className="text-sm rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-muted-foreground">
          Only admins can invite teammates.
        </p>
      ) : null}

      {admin && invitations.length > 0 ? (
        <section>
          <h2 className={`${workspaceSectionTitleClass} mb-2`}>
            Waiting to join ({invitations.length})
          </h2>
          <div className={`${workspaceCardClass} divide-y divide-border overflow-hidden`}>
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Mail className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {inv.emailAddress}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {formatInvitedAgo(inv.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold border border-border">
                    {formatOrgRole(inv.role)}
                  </span>
                  <ResendInviteButton orgSlug={ctx.slug} invitationId={inv.id} />
                  <RevokeInviteButton orgSlug={ctx.slug} invitationId={inv.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <MembersListClient
          members={memberRows}
          title={`Active · ${memberRows.length}`}
          orgSlug={ctx.slug}
          isAdmin={admin}
          currentUserId={userId}
          workload={workload}
          insightsPolicy={ctx.insightsPolicy}
        />
      </section>

      <Link href={`/o/${encodeURIComponent(ctx.slug)}`} className={workspaceMutedLinkClass}>
        ← Pulse
      </Link>
    </div>
  );
}
