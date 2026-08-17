'use client';

import { useOrganizationList, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { declineWorkspaceInvitation } from '@/app/(b2b)/o/actions';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  buildInviteJoinPath,
  clearInviteJoin,
  peekInviteJoinPath,
  peekInviteJustJoined,
  rememberInviteJoin,
} from '@/lib/inviteJoin';
import {
  workspaceCardClass,
  workspacePrimaryButtonClass,
  workspaceSecondaryButtonClass,
} from '@/components/b2b/workspaceShellClasses';

function invitationEmail(invitation) {
  return String(
    invitation?.emailAddress
    || invitation?.email_address
    || '',
  ).trim().toLowerCase();
}

function invitationSlug(invitation) {
  return invitation?.publicOrganizationData?.slug || null;
}

/** Pending invites on /o. Join opens the overlay; Decline removes it. */
export default function PendingWorkspaceInvites() {
  const router = useRouter();
  const { user } = useUser();
  const { isLoaded, userInvitations, userMemberships } = useOrganizationList({
    userInvitations: true,
    userMemberships: true,
  });
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [declineTarget, setDeclineTarget] = useState(null);

  const invites = useMemo(() => {
    if (peekInviteJoinPath() || peekInviteJustJoined()) return [];
    const memberSlugs = new Set(
      (userMemberships?.data || [])
        .map((membership) => membership?.organization?.slug)
        .filter(Boolean),
    );
    return (userInvitations?.data || []).filter((invitation) => {
      const slug = invitationSlug(invitation);
      return Boolean(slug) && !memberSlugs.has(slug);
    });
  }, [userInvitations?.data, userMemberships?.data]);

  if (!isLoaded || invites.length === 0) return null;

  const onJoin = (invitation) => {
    const slug = invitationSlug(invitation);
    if (!slug) return;
    const email =
      invitationEmail(invitation)
      || String(user?.primaryEmailAddress?.emailAddress || '').trim().toLowerCase();
    setBusyId(invitation.id);
    rememberInviteJoin({
      slug,
      email,
      name: invitation.publicOrganizationData?.name || slug,
      resume: true,
    });
    router.replace(buildInviteJoinPath(slug, email));
  };

  const onDecline = async () => {
    if (!declineTarget) return;
    const slug = invitationSlug(declineTarget);
    setBusyId(declineTarget.id);
    setError('');
    try {
      if (typeof declineTarget.reject === 'function') {
        try {
          await declineTarget.reject();
        } catch {
          /* server revoke is the source of truth */
        }
      }
      const result = await declineWorkspaceInvitation(slug, declineTarget.id);
      if (result?.error) {
        setError(result.error);
        return;
      }
      clearInviteJoin();
      setDeclineTarget(null);
      await userInvitations?.revalidate?.();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not decline this invitation.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <>
      <section className={`${workspaceCardClass} mb-6 overflow-hidden`}>
        <div className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Pending invitations</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Join with the exact Gmail the invite was sent to. Decline if you do not want to join.
          </p>
        </div>
        {error ? (
          <p className="px-4 py-2 text-sm text-rose-600" role="alert">
            {error}
          </p>
        ) : null}
        <ul className="divide-y divide-border">
          {invites.map((invitation) => {
            const name =
              invitation.publicOrganizationData?.name
              || invitation.publicOrganizationData?.slug
              || 'Workspace';
            const slug = invitationSlug(invitation);
            const email = invitationEmail(invitation);
            const busy = busyId === invitation.id;
            return (
              <li
                key={invitation.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  {email ? (
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{email}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={!slug || Boolean(busyId)}
                    onClick={() => setDeclineTarget(invitation)}
                    className={workspaceSecondaryButtonClass}
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    disabled={!slug || Boolean(busyId)}
                    onClick={() => onJoin(invitation)}
                    className={workspacePrimaryButtonClass}
                  >
                    {busy && !declineTarget ? 'Opening…' : 'Join workspace'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <ConfirmModal
        open={Boolean(declineTarget)}
        title="Decline this invitation?"
        description="You will not join the workspace. An admin can send a new invite later if you change your mind."
        confirmLabel={busyId && declineTarget ? 'Declining…' : 'Decline invite'}
        cancelLabel="Keep invite"
        tone="danger"
        busy={Boolean(busyId) && Boolean(declineTarget)}
        onCancel={() => {
          if (busyId) return;
          setDeclineTarget(null);
        }}
        onConfirm={() => void onDecline()}
      />
    </>
  );
}
