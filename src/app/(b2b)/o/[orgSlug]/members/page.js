import Link from 'next/link';
import { Mail } from 'lucide-react';
import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import InviteMemberForm from '@/components/b2b/InviteMemberForm';
import MembersListClient from '@/components/b2b/MembersListClient';
import RevokeInviteButton from '@/components/b2b/RevokeInviteButton';
import {
  workspaceCardClass,
  workspacePageTitleClass,
} from '@/components/b2b/workspaceShellClasses';
import {
  getMembershipForSlug,
  getOrgMembers,
  getPendingInvitations,
  isOrgAdmin,
} from '@/lib/org';
import { plainOrgMembersForClient } from '@/lib/orgMembersPlain';

function formatRole(role) {
  if (role === 'org:admin') return 'Admin';
  if (role === 'org:member') return 'Member';
  return role;
}

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

export default async function MembersPage({ params }) {
  const { userId } = await auth();
  if (!userId) redirect('/signin');

  const { orgSlug } = await params;
  const membership = await getMembershipForSlug(userId, orgSlug);
  if (!membership) notFound();

  const org = membership.organization;
  const admin = isOrgAdmin(membership);
  const [members, invitations] = await Promise.all([
    getOrgMembers(org.id),
    admin ? getPendingInvitations(org.id) : Promise.resolve([]),
  ]);

  const memberRows = plainOrgMembersForClient(members);

  return (
    <div className="w-full">
      <p className="text-[#5D3FD3] text-xs font-semibold uppercase tracking-widest mb-2">Workspace</p>
      <h1 className={workspacePageTitleClass}>Members</h1>
      <p className="text-gray-600 text-base sm:text-lg mt-3 max-w-3xl leading-relaxed">
        Manage who has access to{' '}
        <strong className="text-gray-900 font-semibold">{org.name}</strong>.
      </p>

      {admin ? (
        <div className="mt-8 sm:mt-10">
          <InviteMemberForm orgSlug={org.slug} />
        </div>
      ) : (
        <p
          className="mt-8 text-sm sm:text-base text-amber-900/90 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5 sm:px-5 sm:py-4 shadow-sm font-medium leading-relaxed max-w-3xl"
        >
          Only admins can invite teammates. Ask a workspace admin to send you an invite or promote your
          role in Clerk.
        </p>
      )}

      {admin && invitations.length > 0 ? (
        <section className="mt-10 sm:mt-12">
          <h2 className="text-base font-semibold text-gray-900 mb-4 tracking-tight">
            Pending invites ({invitations.length})
          </h2>
          <div className={`${workspaceCardClass} divide-y divide-slate-100 overflow-hidden`}>
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-6 sm:py-4"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#5D3FD3]/10 text-[#5D3FD3]">
                    <Mail className="h-5 w-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                      {inv.emailAddress}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                      {formatInvitedAgo(inv.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-gray-700 border border-slate-200/80">
                    {formatRole(inv.role)}
                  </span>
                  <RevokeInviteButton orgSlug={org.slug} invitationId={inv.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10 sm:mt-12">
        <MembersListClient
          members={memberRows}
          title={`Active members (${memberRows.length})`}
        />
      </section>

      <Link
        href={`/o/${encodeURIComponent(org.slug)}`}
        className="inline-block mt-10 sm:mt-12 text-sm sm:text-base font-medium text-gray-500 hover:text-[#5D3FD3] transition-colors"
      >
        ← Workspace overview
      </Link>
    </div>
  );
}
