'use client';

import { useActionState } from 'react';
import { createWorkspace } from '@/app/(b2b)/o/actions';
import { workspacePrimaryButtonClass } from '@/components/b2b/workspaceShellClasses';

const initialState = { error: null };

const inputClass =
  'w-full rounded-xl border border-border bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-[#5D3FD3]/35';

export default function CreateWorkspaceForm() {
  const [state, formAction, pending] = useActionState(createWorkspace, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="workspace-name" className="block text-sm font-semibold text-foreground mb-1.5">
          Company or team name
        </label>
        <input
          id="workspace-name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={80}
          placeholder="Acme Inc."
          className={inputClass}
        />
      </div>
      {state?.error ? (
        <p className="text-sm text-red-700 font-medium" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={`w-full ${workspacePrimaryButtonClass} disabled:opacity-50`}
      >
        {pending ? 'Creating…' : 'Create workspace'}
      </button>
    </form>
  );
}
