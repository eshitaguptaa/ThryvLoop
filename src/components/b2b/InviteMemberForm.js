'use client';

import { useActionState } from 'react';
import { inviteMember } from '@/app/(b2b)/o/actions';
import WorkspaceSelect from '@/components/b2b/WorkspaceSelect';
import {
  workspaceCardClass,
  workspaceInputClass,
  workspacePrimaryButtonClass,
} from '@/components/b2b/workspaceShellClasses';

const initialState = { error: null, success: false, message: null };

export default function InviteMemberForm({ orgSlug }) {
  const boundInvite = inviteMember.bind(null, orgSlug);
  const [state, formAction, pending] = useActionState(boundInvite, initialState);

  return (
    <div className={`${workspaceCardClass} p-4 sm:p-5`}>
      <form action={formAction} className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Invite a teammate</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            They get a short email from you with one button to join.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-stretch">
          <input
            name="email"
            type="email"
            required
            placeholder="name@gmail.com"
            className={`flex-1 min-w-0 ${workspaceInputClass}`}
            autoComplete="email"
          />
          <WorkspaceSelect
            name="role"
            defaultValue="org:member"
            size="md"
            className="sm:w-36 shrink-0 w-full"
          >
            <option value="org:member">Member</option>
            <option value="org:admin">Admin</option>
          </WorkspaceSelect>
          <button
            type="submit"
            disabled={pending}
            className={`${workspacePrimaryButtonClass} disabled:opacity-50 sm:shrink-0 whitespace-nowrap`}
          >
            {pending ? 'Sending…' : 'Send invite'}
          </button>
        </div>
        {state?.error ? (
          <p className="text-sm text-rose-600 font-medium" role="alert">
            {state.error}
          </p>
        ) : null}
        {state?.success && state?.message ? (
          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium" role="status">
            {state.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}
