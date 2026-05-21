'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownUp, Calendar, GripVertical, ListFilter, Loader2, Plus, Trash2, X } from 'lucide-react';
import AssignTaskModal from '@/components/b2b/AssignTaskModal';
import { workspacePageTitleClass } from '@/components/b2b/workspaceShellClasses';
import { ORG_TASK_COLUMNS, PRIORITY_STYLES, memberLabel } from '@/lib/orgTasks';
import { getSupabaseClient, setSupabaseAuthToken } from '@/utils/userStorage';

const COLUMN_ACCENT = {
  todo: 'border-t-[#c4b8f5]',
  in_progress: 'border-t-[#b45309]',
  done: 'border-t-[#5D3FD3]',
};

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#5D3FD3]/35';

function labelInitials(label) {
  const s = (label || '').trim();
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return s.slice(0, 2).toUpperCase() || '?';
}

export default function OrgTasksBoard({
  organizationId,
  isAdmin,
  members,
  currentUserId,
  orgName = '',
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [saving, setSaving] = useState(false);
  const [assignModal, setAssignModal] = useState({ open: false, columnKey: 'todo' });
  const [editTask, setEditTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeUserId: members[0]?.userId || '',
    dueDate: '',
    priority: 'medium',
    category: 'General',
  });

  const loadTasks = useCallback(async () => {
    if (!organizationId) {
      setError(
        'Workspace could not be linked to Supabase. Run both migrations in supabase/migrations (organizations + organization_tasks), then refresh.'
      );
      setLoading(false);
      return;
    }
    const token = await getToken({ template: 'supabase' });
    if (!token) {
      setError('Unable to authenticate with Supabase.');
      setLoading(false);
      return;
    }
    setSupabaseAuthToken(token);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError('Supabase client not configured.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    let query = supabase
      .from('organization_tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('assignee_user_id', currentUserId);
    }

    const { data, error: qErr } = await query;
    if (qErr) {
      setError(qErr.message);
      setTasks([]);
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  }, [organizationId, getToken, isAdmin, currentUserId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    queueMicrotask(() => {
      void loadTasks();
    });
  }, [isLoaded, isSignedIn, loadTasks]);

  const visibleTasks = useMemo(() => {
    if (!isAdmin || filterAssignee === 'all') return tasks;
    return tasks.filter((t) => t.assignee_user_id === filterAssignee);
  }, [tasks, isAdmin, filterAssignee]);

  const tasksByColumn = useMemo(() => {
    const map = { todo: [], in_progress: [], done: [] };
    visibleTasks.forEach((t) => {
      const col = map[t.column_key] ? t.column_key : 'todo';
      map[col].push(t);
    });
    return map;
  }, [visibleTasks]);

  const openAssignModal = (columnKey) => {
    setForm((f) => ({
      ...f,
      title: '',
      description: '',
      dueDate: '',
      assigneeUserId: members[0]?.userId || f.assigneeUserId,
    }));
    setAssignModal({ open: true, columnKey });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isAdmin || !form.title.trim() || !form.assigneeUserId) return;
    setSaving(true);
    setError('');
    const token = await getToken({ template: 'supabase' });
    setSupabaseAuthToken(token);
    const supabase = getSupabaseClient();
    const { error: insErr } = await supabase.from('organization_tasks').insert({
      organization_id: organizationId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      assignee_user_id: form.assigneeUserId,
      created_by_user_id: currentUserId,
      due_date: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      priority: form.priority,
      category: form.category,
      column_key: assignModal.columnKey,
    });
    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    setAssignModal({ open: false, columnKey: 'todo' });
    await loadTasks();
  };

  const moveTask = async (task, columnKey) => {
    if (task.column_key === columnKey) return;
    setError('');

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              column_key: columnKey,
              completed_at: columnKey === 'done' ? new Date().toISOString() : null,
            }
          : t
      )
    );

    const token = await getToken({ template: 'supabase' });
    setSupabaseAuthToken(token);
    const supabase = getSupabaseClient();
    const completedAt = columnKey === 'done' ? new Date().toISOString() : null;
    const { error: upErr } = await supabase
      .from('organization_tasks')
      .update({
        column_key: columnKey,
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', task.id);
    if (upErr) {
      setError(upErr.message);
      await loadTasks();
    }
  };

  const deleteTask = async (taskId) => {
    if (!isAdmin || !confirm('Delete this task?')) return;
    const token = await getToken({ template: 'supabase' });
    setSupabaseAuthToken(token);
    const supabase = getSupabaseClient();
    const { error: delErr } = await supabase.from('organization_tasks').delete().eq('id', taskId);
    if (delErr) setError(delErr.message);
    else await loadTasks();
  };

  const persistEdit = async (payload) => {
    const token = await getToken({ template: 'supabase' });
    setSupabaseAuthToken(token);
    const supabase = getSupabaseClient();
    const updatePayload = {
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      category: payload.category,
      priority: payload.priority,
      due_date: payload.due_date,
      updated_at: new Date().toISOString(),
    };
    if (isAdmin) {
      updatePayload.assignee_user_id = payload.assignee_user_id;
    }
    const { error: upErr } = await supabase
      .from('organization_tasks')
      .update(updatePayload)
      .eq('id', payload.id);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setEditTask(null);
    await loadTasks();
  };

  const formatDue = (due) => {
    if (!due) return null;
    return new Date(due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const canDrag = (task) => isAdmin || task.assignee_user_id === currentUserId;

  const columnLabel = ORG_TASK_COLUMNS.find((c) => c.key === assignModal.columnKey)?.label || 'To do';

  return (
    <div className="w-full min-w-0 max-w-full">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8 mb-6 lg:mb-8">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-[#5D3FD3] text-xs font-semibold uppercase tracking-widest mb-2">Tasks</p>
          <h1 className={workspacePageTitleClass}>
            {isAdmin ? 'Team kanban' : 'My assigned work'}
          </h1>
          <p className="text-gray-500 text-sm sm:text-base mt-3 leading-relaxed max-w-4xl">
            {orgName ? (
              <>
                <span className="text-gray-800 font-medium">{orgName}</span>
                {' · '}
              </>
            ) : null}
            {isAdmin
              ? 'Assign tasks from any column. Members only see work assigned to them.'
              : 'Tasks your admin assigned to you. Drag cards to update status.'}
          </p>
        </div>
        {isAdmin ? (
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3 shrink-0 lg:pt-2">
            <label
              htmlFor="kanban-member-filter"
              className="text-xs sm:text-sm font-medium text-gray-500 whitespace-nowrap"
            >
              View member
            </label>
            <select
              id="kanban-member-filter"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="rounded-full border border-slate-200/90 bg-white text-sm px-4 py-2.5 text-gray-900 min-w-46 shadow-[0_1px_2px_rgba(15,23,42,0.06)] focus:outline-none focus:ring-2 focus:ring-[#5D3FD3]/30"
            >
              <option value="all">All members</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <span className="text-xs sm:text-sm rounded-full border border-[#5D3FD3]/20 bg-[#5D3FD3]/8 text-[#5D3FD3] font-semibold px-3 py-1.5 lg:mt-2 self-start">
            Assigned to you only
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3 mb-6 lg:mb-8">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:bg-slate-50/90 transition-colors"
        >
          <ListFilter className="h-4 w-4 text-gray-500" aria-hidden />
          Filter
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-[0_1px_2px_rgba(15,23,42,0.05)] hover:bg-slate-50/90 transition-colors"
        >
          <ArrowDownUp className="h-4 w-4 text-gray-500" aria-hidden />
          Sort
        </button>
      </div>

      {error ? (
        <p className="mb-6 text-sm text-red-700 rounded-xl border border-red-200 bg-red-50 px-4 py-2">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading board…
        </div>
      ) : (
        <div className="w-full min-w-0">
          {/* Full-width board: equal columns on md+, horizontal scroll on small screens */}
          <div className="flex md:grid md:grid-cols-3 w-full gap-4 sm:gap-5 lg:gap-6 md:min-h-[min(36rem,calc(100vh-17rem))] lg:min-h-[min(40rem,calc(100vh-16rem))] overflow-x-auto md:overflow-x-visible pb-1 snap-x snap-mandatory md:snap-none [scrollbar-width:thin]">
            {ORG_TASK_COLUMNS.map((col) => (
              <section
                key={col.key}
                className={`shrink-0 snap-start w-[min(22rem,calc(100vw-2rem))] md:w-auto md:min-w-0 flex flex-col h-full min-h-[min(28rem,calc(100vh-18rem))] md:min-h-0 rounded-xl sm:rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)] border-t-[3px] ${COLUMN_ACCENT[col.key]} transition-colors ${
                  dragOverColumn === col.key ? 'ring-2 ring-[#5D3FD3]/40 bg-white shadow-md' : ''
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverColumn(col.key);
                }}
                onDragLeave={() => setDragOverColumn(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedTask && canDrag(draggedTask)) {
                    void moveTask(draggedTask, col.key);
                  }
                  setDraggedTask(null);
                  setDragOverColumn(null);
                }}
              >
                <header className="px-4 py-3 sm:px-5 sm:py-3.5 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl sm:rounded-t-2xl shrink-0">
                  <h3 className="text-sm font-semibold text-gray-900">{col.label}</h3>
                  <span className="text-xs font-semibold text-gray-500 bg-slate-100 px-2.5 py-0.5 rounded-full tabular-nums min-w-7 text-center">
                    {tasksByColumn[col.key].length}
                  </span>
                </header>

                <ul className="p-3 sm:p-4 space-y-3 sm:space-y-4 flex-1 overflow-y-auto min-h-0 max-h-[calc(100vh-22rem)] md:max-h-none">
                  {tasksByColumn[col.key].map((task) => (
                    <li
                      key={task.id}
                      draggable={canDrag(task)}
                      onDragStart={() => setDraggedTask(task)}
                      onDragEnd={() => {
                        setDraggedTask(null);
                        setDragOverColumn(null);
                      }}
                      onDoubleClick={() => {
                        if (canDrag(task) || isAdmin) setEditTask(task);
                      }}
                      className={`rounded-xl border border-slate-200/80 bg-white p-3.5 space-y-2.5 ${
                        canDrag(task) ? 'cursor-grab active:cursor-grabbing' : ''
                      } ${draggedTask?.id === task.id ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        {canDrag(task) ? (
                          <GripVertical className="w-3.5 h-3.5 text-gray-300 shrink-0 mt-0.5" />
                        ) : null}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 leading-snug">{task.title}</p>
                          {task.description ? (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                          ) : null}
                        </div>
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => deleteTask(task.id)}
                            className="text-gray-300 hover:text-red-600 shrink-0"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-1.5 pl-5">
                        <span
                          className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border ${PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium}`}
                        >
                          {String(task.priority).toUpperCase()}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F3F0FF] text-[#5D3FD3]/90 font-medium border border-[#5D3FD3]/12">
                          {task.category}
                        </span>
                      </div>
                      {isAdmin ? (
                        <div className="flex items-center gap-2 pl-8 pt-1">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#5D3FD3] text-[10px] font-bold text-white">
                            {labelInitials(memberLabel(members, task.assignee_user_id))}
                          </span>
                          <span className="text-xs font-semibold text-gray-800">
                            {memberLabel(members, task.assignee_user_id)}
                          </span>
                        </div>
                      ) : null}
                      {task.due_date ? (
                        <p className="text-xs text-gray-500 flex items-center gap-1 pl-8">
                          <Calendar className="w-3 h-3 shrink-0" />
                          Due {formatDue(task.due_date)}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>

                {isAdmin ? (
                  <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/40 rounded-b-xl sm:rounded-b-2xl shrink-0">
                    <button
                      type="button"
                      onClick={() => openAssignModal(col.key)}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#5D3FD3]/12 py-2.5 sm:py-3 text-sm font-semibold text-[#5D3FD3] hover:bg-[#5D3FD3]/18 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Assign to member
                    </button>
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </div>
      )}

      <AssignTaskModal
        open={assignModal.open}
        onClose={() => setAssignModal({ open: false, columnKey: 'todo' })}
        columnLabel={columnLabel}
        form={form}
        setForm={setForm}
        members={members}
        saving={saving}
        onSubmit={handleCreate}
      />

      {editTask && (
        <EditTaskModal
          task={editTask}
          isAdmin={isAdmin}
          members={members}
          onClose={() => setEditTask(null)}
          onSave={persistEdit}
        />
      )}
    </div>
  );
}

function EditTaskModal({ task, isAdmin, members, onClose, onSave }) {
  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [category, setCategory] = useState(task.category || 'General');
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '');
  const [assigneeUserId, setAssigneeUserId] = useState(task.assignee_user_id || '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const due_iso = dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : null;
    await onSave({
      id: task.id,
      title,
      description,
      category,
      priority,
      due_date: due_iso,
      assignee_user_id: assigneeUserId,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Edit task</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className={inputClass}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className={`${inputClass} resize-none`}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={inputClass}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            <option value="General">General</option>
            <option value="Project">Project</option>
            <option value="Operations">Operations</option>
            <option value="Support">Support</option>
            <option value="Other">Other</option>
          </select>
          {isAdmin && (
            <select
              value={assigneeUserId}
              onChange={(e) => setAssigneeUserId(e.target.value)}
              className={inputClass}
            >
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.label}
                </option>
              ))}
            </select>
          )}
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
              className="flex-1 rounded-lg bg-[#5D3FD3] hover:bg-[#5032c4] py-2.5 text-sm font-semibold text-white shadow-sm"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
