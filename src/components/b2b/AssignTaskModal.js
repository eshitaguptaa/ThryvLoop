'use client';

import { X } from 'lucide-react';
import WorkspaceSelect from '@/components/b2b/WorkspaceSelect';
import { workspaceInputClass } from '@/components/b2b/workspaceShellClasses';
import DatePickerField from '@/components/ui/DatePickerField';

const CATEGORIES = ['General', 'Project', 'Operations', 'Support', 'Other'];

const fieldClass = workspaceInputClass;

export default function AssignTaskModal({
  open,
  onClose,
  columnLabel,
  form,
  setForm,
  members,
  projects = [],
  saving,
  onSubmit,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-task-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h2 id="assign-task-title" className="text-base font-semibold text-foreground">
              Assign task
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Adds to {columnLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-5 space-y-3">
          <input
            required
            autoFocus
            placeholder="Task title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={fieldClass}
          />
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className={`${fieldClass} resize-none`}
          />
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Assign to
          </label>
          <WorkspaceSelect
            required
            value={form.assigneeUserId}
            onChange={(e) => setForm({ ...form, assigneeUserId: e.target.value })}
            className="w-full block"
            size="md"
          >
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.label}
              </option>
            ))}
          </WorkspaceSelect>
          <div className="grid grid-cols-2 gap-3">
            <DatePickerField
              value={form.dueDate}
              onChange={(next) => setForm({ ...form, dueDate: next })}
              placeholder="Due date"
              aria-label="Due date"
              triggerClassName={fieldClass}
            />
            <WorkspaceSelect
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full block"
              size="md"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </WorkspaceSelect>
          </div>
          <WorkspaceSelect
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full block"
            size="md"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </WorkspaceSelect>
          {projects.length > 0 ? (
            <WorkspaceSelect
              value={form.projectId || ''}
              onChange={(e) => setForm({ ...form, projectId: e.target.value })}
              className="w-full block"
              size="md"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </WorkspaceSelect>
          ) : null}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-[#5D3FD3] hover:bg-[#5032c4] disabled:opacity-50 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
            >
              {saving ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
