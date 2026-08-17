'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { resendInvitation } from '@/app/(b2b)/o/actions';

export default function ResendInviteButton({ orgSlug, invitationId }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await resendInvitation(orgSlug, invitationId);
            if (result?.error) {
              setError(result.error);
              return;
            }
            router.refresh();
          });
        }}
        className="text-xs font-semibold text-[#5D3FD3] dark:text-[#c4b5fd] hover:underline underline-offset-2 disabled:opacity-50"
      >
        {pending ? 'Sending…' : 'Resend'}
      </button>
      {error ? (
        <span className="text-[11px] text-rose-600 mt-0.5 max-w-[10rem] text-right" role="alert">
          {error}
        </span>
      ) : null}
    </span>
  );
}
