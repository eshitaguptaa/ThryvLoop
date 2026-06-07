'use client';

import { useActionState } from 'react';
import { inviteMember } from '@/app/(b2b)/o/actions';
import { workspacePrimaryButtonClass } from '@/components/b2b/workspaceShellClasses';

const initialState = { error: null, success: false, message: null };

const fieldClass =
  'rounded-xl border border-border bg-card text-sm px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground shadow-[0_1px_2px_rgba(15,23,42,0.06)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.2)] focus:outline-none focus:ring-2 focus:ring-[#5D3FD3]/30';

export default function InviteMemberForm({ orgSlug }) {
  const boundInvite = inviteMember.bind(null, orgSlug);
  const [state, formAction, pending] = useActionState(boundInvite, initialState);

  return (
    <div
      className="rounded-2xl border border-[#5D3FD3]/12 bg-[#F3F0FF] dark:bg-[#5D3FD3]/10 p-5 sm:p-6 md:p-7 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06),0_8px_24px_-8px_rgba(93,63,211,0.08)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3),0_8px_24px_-8px_rgba(93,63,211,0.12)]"
    >
      <form action={formAction} className="space-y-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">Invite by email</h2>
          <p className="text-sm text-muted-foreground leading-relaxed mt-2 max-w-3xl">
            Clerk sends the invite link. After they sign up or sign in, they land in this workspace
            automatically.
          </p>
        </div>
        <div className="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center">
          <input
            name="email"
            type="email"
            required
            placeholder="colleague@company.com"
            className={`flex-1 min-w-0 ${fieldClass}`}
          />
          <select
            name="role"
            defaultValue="org:member"
            className={`xl:w-44 shrink-0 ${fieldClass} cursor-pointer`}
          >
            <option value="org:member">Member</option>
            <option value="org:admin">Admin</option>
          </select>
          <button
            type="submit"
            disabled={pending}
            className={`${workspacePrimaryButtonClass} disabled:opacity-50 xl:shrink-0 whitespace-nowrap`}
          >
            {pending ? 'Sending…' : 'Send invite'}
          </button>
        </div>
        {state?.error ? (
          <p className="text-sm text-red-700 font-medium" role="alert">
            {state.error}
          </p>
        ) : null}
        {state?.success && state?.message ? (
          <p className="text-sm text-emerald-700 font-medium" role="status">
            {state.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
