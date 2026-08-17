'use client';

import { useOrganizationList } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { acceptWorkspaceInvitation } from '@/app/(b2b)/o/actions';
import {
  workspaceCardClass,
  workspacePrimaryButtonClass,
} from '@/components/b2b/workspaceShellClasses';

/** Lets a signed-in invitee accept from /o when the email link skipped join. */
export default function PendingWorkspaceInvites() {
  const router = useRouter();
  const { isLoaded, userInvitations, setActive } = useOrganizationList({
    userInvitations: true,
  });
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const invites = userInvitations?.data || [];
  if (!isLoaded || invites.length === 0) return null;

  const onAccept = async (invitation) => {
    const slug = invitation.publicOrganizationData?.slug;
    if (!slug) return;
    setBusyId(invitation.id);
    setError('');
    try {
      if (typeof invitation.accept === 'function') {
        try {
          await invitation.accept();
        } catch {
          /* server join below is the source of truth */
        }
      }
      const result = await acceptWorkspaceInvitation(slug);
      if (!result?.success) {
        setError(result?.error || 'Could not accept this invitation.');
        return;
      }
      const orgId = result.organizationId || invitation.publicOrganizationData?.id;
      if (orgId && setActive) {
        await setActive({ organization: orgId });
      }
      router.replace(`/o/${encodeURIComponent(slug)}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not accept invitation.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className={`${workspaceCardClass} mb-6 overflow-hidden`}>
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground">Pending invitations</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Accept to join the workspace. Use the Gmail the invite was sent to.
        </p>
      </div>
      {error ? (
        <p className="px-4 py-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="divide-y divide-border">
        {invites.map((invitation) => {
          const name =
            invitation.publicOrganizationData?.name
            || invitation.publicOrganizationData?.slug
            || 'Workspace';
          return (
            <li
              key={invitation.id}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <p className="text-sm font-semibold text-foreground">{name}</p>
              <button
                type="button"
                disabled={busyId === invitation.id}
                onClick={() => void onAccept(invitation)}
                className={workspacePrimaryButtonClass}
              >
                {busyId === invitation.id ? 'Joining…' : 'Accept invitation'}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
