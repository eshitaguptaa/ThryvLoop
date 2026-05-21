'use client';

import { X } from 'lucide-react';

const CATEGORIES = ['General', 'Project', 'Operations', 'Support', 'Other'];

const fieldClass =
  'w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/35';

export default function AssignTaskModal({
  open,
  onClose,
  columnLabel,
  form,
  setForm,
  members,
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
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 id="assign-task-title" className="text-base font-semibold text-gray-900">
              Assign task
            </h2>
            <p className="text-xs text-gray-500 mt-0.5 font-medium">Adds to {columnLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100"
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
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Assign to
          </label>
          <select
            required
            value={form.assigneeUserId}
            onChange={(e) => setForm({ ...form, assigneeUserId: e.target.value })}
            className={fieldClass}
          >
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.label}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className={fieldClass}
            />
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className={fieldClass}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className={fieldClass}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors"
            >
              {saving ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
