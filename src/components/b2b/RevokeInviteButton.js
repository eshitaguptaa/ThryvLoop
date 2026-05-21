'use client';

import { useTransition } from 'react';
import { revokeInvitation } from '@/app/(b2b)/o/actions';

export default function RevokeInviteButton({ orgSlug, invitationId, emailAddress }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await revokeInvitation(orgSlug, invitationId);
        });
      }}
      className="text-xs font-semibold text-red-600 hover:text-red-700 underline-offset-2 hover:underline disabled:opacity-50"
    >
      {pending ? 'Revoking…' : 'Revoke'}
    </button>
  );
}
