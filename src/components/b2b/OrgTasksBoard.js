'use client';

import { useAuth } from '@clerk/nextjs';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Archive,
  ArrowDownUp,
  Calendar,
  GripVertical,
  ListFilter,
  Loader2,
  MessageSquare,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import AssignTaskModal from '@/components/b2b/AssignTaskModal';
import WorkspacePageHeader from '@/components/b2b/WorkspacePageHeader';
import WorkspaceSelect from '@/components/b2b/WorkspaceSelect';
import DatePickerField from '@/components/ui/DatePickerField';
import ConfirmModal from '@/components/ui/ConfirmModal';
import TaskArchiveDrawer from '@/components/tasks/TaskArchiveDrawer';
import { insertOrgActivityClient } from '@/lib/orgActivity';
import { ORG_TASK_COLUMNS, PRIORITY_STYLES, memberLabel } from '@/lib/orgTasks';
import {
  archiveTimestampPatch,
  archivedTaskPurgeCutoff,
  DONE_BOARD_RETENTION_DAYS,
  ARCHIVED_TASK_RETENTION_DAYS,
  doneBoardCutoff,
  isLiveBoardTask,
  restoreFromArchivePatch,
} from '@/lib/taskArchive';
import { getSupabaseClient, setSupabaseAuthToken } from '@/utils/userStorage';
import { workspaceInputClass } from '@/components/b2b/workspaceShellClasses';

const COLUMN_HEADER = {
  todo: 'text-slate-600 dark:text-slate-300',
  in_progress: 'text-amber-700 dark:text-amber-300',
  done: 'text-[#5D3FD3] dark:text-[#c4b5fd]',
};

const COLUMN_DOT = {
  todo: 'bg-slate-400',
  in_progress: 'bg-amber-500',
  done: 'bg-[#5D3FD3]',
};

const inputClass = workspaceInputClass;

function labelInitials(label) {
  const s = (label || '').trim();
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return s.slice(0, 2).toUpperCase() || '?';
}

function isOverdue(task) {
  if (!task.due_date || task.column_key === 'done') return false;
  return new Date(task.due_date) < new Date();
}

export default function OrgTasksBoard({
  organizationId,
  isAdmin,
  members,
  currentUserId,
  orgName = '',
  projects = [],
  initialTasks = undefined,
  initialError = '',
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const hydrated = initialTasks !== undefined;
  const [tasks, setTasks] = useState(() =>
    hydrated ? (initialTasks || []).filter(isLiveBoardTask) : []
  );
  const [projectList, setProjectList] = useState(projects);
  const [loading, setLoading] = useState(() => !hydrated);
  const [error, setError] = useState(initialError || '');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [sortKey, setSortKey] = useState('updated');
  const [showFilters, setShowFilters] = useState(false);
  const [saving, setSaving] = useState(false);
  const [assignModal, setAssignModal] = useState({ open: false, columnKey: 'todo' });
  const [detailTask, setDetailTask] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deletingTask, setDeletingTask] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveItems, setArchiveItems] = useState([]);
  const [archiveCount, setArchiveCount] = useState(0);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [restoringId, setRestoringId] = useState(null);
  const [archiveAllOpen, setArchiveAllOpen] = useState(false);
  const [archivingAll, setArchivingAll] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [projectBusy, setProjectBusy] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    assigneeUserId: members[0]?.userId || '',
    dueDate: '',
    priority: 'medium',
    category: 'General',
    projectId: '',
  });

  const loadTasks = useCallback(async ({ silent = false } = {}) => {
    if (!organizationId) {
      setError(
        'Workspace could not be linked to Supabase. Apply the organization migrations, then refresh.'
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

    if (!silent) setLoading(true);
    setError('');

    const cutoffIso = doneBoardCutoff().toISOString();
    let sweep = supabase
      .from('organization_tasks')
      .update(archiveTimestampPatch())
      .eq('organization_id', organizationId)
      .eq('column_key', 'done')
      .is('archived_at', null)
      .lt('completed_at', cutoffIso);
    if (!isAdmin) sweep = sweep.eq('assignee_user_id', currentUserId);
    await sweep;

    if (isAdmin) {
      await supabase
        .from('organization_tasks')
        .delete()
        .eq('organization_id', organizationId)
        .eq('column_key', 'done')
        .not('archived_at', 'is', null)
        .lt('archived_at', archivedTaskPurgeCutoff().toISOString());
    }

    let query = supabase
      .from('organization_tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('assignee_user_id', currentUserId);
    }

    let countQuery = supabase
      .from('organization_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .not('archived_at', 'is', null);
    if (!isAdmin) countQuery = countQuery.eq('assignee_user_id', currentUserId);

    const [{ data, error: qErr }, countRes] = await Promise.all([query, countQuery]);
    if (qErr) {
      setError(qErr.message);
      setTasks([]);
    } else {
      setTasks((data || []).filter(isLiveBoardTask));
    }
    if (!countRes.error) setArchiveCount(countRes.count || 0);
    setLoading(false);
  }, [organizationId, getToken, isAdmin, currentUserId]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    queueMicrotask(() => {
      void loadTasks({ silent: hydrated });
    });
  }, [isLoaded, isSignedIn, loadTasks, hydrated]);

  /** Realtime multiplayer board */
  useEffect(() => {
    if (!organizationId || !isLoaded || !isSignedIn) return undefined;
    let channel;
    let cancelled = false;

    (async () => {
      const token = await getToken({ template: 'supabase' });
      if (!token || cancelled) return;
      setSupabaseAuthToken(token);
      const supabase = getSupabaseClient();
      if (!supabase) return;

      channel = supabase
        .channel(`org-tasks-${organizationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'organization_tasks',
            filter: `organization_id=eq.${organizationId}`,
          },
          () => {
            void loadTasks({ silent: true });
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) {
        const supabase = getSupabaseClient();
        if (supabase) void supabase.removeChannel(channel);
      }
    };
  }, [organizationId, isLoaded, isSignedIn, getToken, loadTasks]);

  const visibleTasks = useMemo(() => {
    let list = tasks;
    if (isAdmin && filterAssignee !== 'all') {
      list = list.filter((t) => t.assignee_user_id === filterAssignee);
    }
    if (filterPriority !== 'all') {
      list = list.filter((t) => t.priority === filterPriority);
    }
    if (filterProject === 'none') {
      list = list.filter((t) => !t.project_id);
    } else if (filterProject !== 'all') {
      list = list.filter((t) => t.project_id === filterProject);
    }

    const sorted = [...list];
    sorted.sort((a, b) => {
      if (sortKey === 'priority') {
        const order = { high: 0, medium: 1, low: 2 };
        return (order[a.priority] ?? 9) - (order[b.priority] ?? 9);
      }
      if (sortKey === 'due') {
        const ad = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY;
        const bd = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY;
        return ad - bd;
      }
      if (sortKey === 'title') {
        return String(a.title || '').localeCompare(String(b.title || ''));
      }
      const au = a.updated_at ? new Date(a.updated_at).getTime() : 0;
      const bu = b.updated_at ? new Date(b.updated_at).getTime() : 0;
      return bu - au;
    });
    return sorted;
  }, [tasks, isAdmin, filterAssignee, filterPriority, filterProject, sortKey]);

  const tasksByColumn = useMemo(() => {
    const map = { todo: [], in_progress: [], done: [] };
    visibleTasks.forEach((t) => {
      if (!isLiveBoardTask(t)) return;
      const col = map[t.column_key] ? t.column_key : 'todo';
      map[col].push(t);
    });
    return map;
  }, [visibleTasks]);

  const projectName = (id) => projectList.find((p) => p.id === id)?.name;

  const openAssignModal = (columnKey) => {
    setForm((f) => ({
      ...f,
      title: '',
      description: '',
      dueDate: '',
      assigneeUserId: members[0]?.userId || f.assigneeUserId,
      projectId: filterProject !== 'all' && filterProject !== 'none' ? filterProject : '',
    }));
    setAssignModal({ open: true, columnKey });
  };

  const logActivity = async (supabase, eventType, summary, metadata = {}) => {
    await insertOrgActivityClient(supabase, {
      organizationId,
      actorUserId: currentUserId,
      eventType,
      summary,
      metadata,
    });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!isAdmin || !form.title.trim() || !form.assigneeUserId) return;
    setSaving(true);
    setError('');
    const token = await getToken({ template: 'supabase' });
    setSupabaseAuthToken(token);
    const supabase = getSupabaseClient();
    const payload = {
      organization_id: organizationId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      assignee_user_id: form.assigneeUserId,
      created_by_user_id: currentUserId,
      due_date: form.dueDate ? new Date(form.dueDate).toISOString() : null,
      priority: form.priority,
      category: form.category,
      column_key: assignModal.columnKey,
      project_id: form.projectId || null,
    };
    const { data, error: insErr } = await supabase
      .from('organization_tasks')
      .insert(payload)
      .select('*')
      .maybeSingle();
    setSaving(false);
    if (insErr) {
      setError(insErr.message);
      return;
    }
    await logActivity(
      supabase,
      'task_assigned',
      `Assigned “${form.title.trim()}” to ${memberLabel(members, form.assigneeUserId)}`,
      { taskId: data?.id, assigneeUserId: form.assigneeUserId }
    );
    setAssignModal({ open: false, columnKey: 'todo' });
    await loadTasks({ silent: true });
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
              updated_at: new Date().toISOString(),
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
      await loadTasks({ silent: true });
      return;
    }
    const colLabel = ORG_TASK_COLUMNS.find((c) => c.key === columnKey)?.label || columnKey;
    await logActivity(supabase, 'task_moved', `Moved “${task.title}” to ${colLabel}`, {
      taskId: task.id,
      columnKey,
    });
  };

  const requestDeleteTask = (task) => {
    if (!isAdmin || !task) return;
    setTaskToDelete(task);
  };

  const confirmDeleteTask = async () => {
    const task = taskToDelete;
    if (!isAdmin || !task || deletingTask) return;
    setDeletingTask(true);
    const token = await getToken({ template: 'supabase' });
    setSupabaseAuthToken(token);
    const supabase = getSupabaseClient();
    const { error: delErr } = await supabase.from('organization_tasks').delete().eq('id', task.id);
    setDeletingTask(false);
    if (delErr) {
      setError(delErr.message);
      return;
    }
    await logActivity(supabase, 'task_deleted', `Deleted “${task.title}”`, { taskId: task.id });
    setTaskToDelete(null);
    setDetailTask(null);
    await loadTasks({ silent: true });
  };

  const mapArchiveRow = (row) => ({
    id: row.id,
    title: row.title,
    completedAt: row.completed_at || row.archived_at,
    subtitle: memberLabel(members, row.assignee_user_id),
  });

  const loadArchive = async () => {
    if (!organizationId) return;
    setArchiveLoading(true);
    const token = await getToken({ template: 'supabase' });
    setSupabaseAuthToken(token);
    const supabase = getSupabaseClient();
    let query = supabase
      .from('organization_tasks')
      .select('id, title, completed_at, archived_at, assignee_user_id')
      .eq('organization_id', organizationId)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false })
      .limit(200);
    if (!isAdmin) query = query.eq('assignee_user_id', currentUserId);
    const { data, error: qErr } = await query;
    setArchiveLoading(false);
    if (qErr) {
      setError(qErr.message);
      setArchiveItems([]);
      return;
    }
    const rows = data || [];
    setArchiveItems(rows.map(mapArchiveRow));
    setArchiveCount(rows.length >= 200 ? archiveCount : rows.length);
  };

  const openArchive = () => {
    setArchiveSearch('');
    setArchiveOpen(true);
    void loadArchive();
  };

  const archiveTask = async (task) => {
    if (!task) return;
    if (!isAdmin && task.assignee_user_id !== currentUserId) return;
    const patch = archiveTimestampPatch();
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    setArchiveCount((n) => n + 1);
    if (detailTask?.id === task.id) setDetailTask(null);
    const token = await getToken({ template: 'supabase' });
    setSupabaseAuthToken(token);
    const supabase = getSupabaseClient();
    const { error: upErr } = await supabase
      .from('organization_tasks')
      .update(patch)
      .eq('id', task.id);
    if (upErr) {
      setError(upErr.message);
      await loadTasks({ silent: true });
      return;
    }
    await logActivity(supabase, 'task_archived', `Archived “${task.title}”`, { taskId: task.id });
    if (archiveOpen) void loadArchive();
  };

  const confirmArchiveAllDone = async () => {
    const ids = tasks
      .filter((t) => t.column_key === 'done' && isLiveBoardTask(t))
      .map((t) => t.id)
      .filter(Boolean);
    if (ids.length === 0) {
      setArchiveAllOpen(false);
      return;
    }
    setArchivingAll(true);
    const patch = archiveTimestampPatch();
    const token = await getToken({ template: 'supabase' });
    setSupabaseAuthToken(token);
    const supabase = getSupabaseClient();
    const { error: upErr } = await supabase
      .from('organization_tasks')
      .update(patch)
      .in('id', ids);
    setArchivingAll(false);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setTasks((prev) => prev.filter((t) => t.column_key !== 'done'));
    setArchiveCount((n) => n + ids.length);
    setArchiveAllOpen(false);
    await logActivity(supabase, 'tasks_archived', `Archived ${ids.length} done task${ids.length === 1 ? '' : 's'}`);
    if (archiveOpen) void loadArchive();
  };

  const restoreArchivedTask = async (taskId) => {
    setRestoringId(taskId);
    const token = await getToken({ template: 'supabase' });
    setSupabaseAuthToken(token);
    const supabase = getSupabaseClient();
    const { error: upErr } = await supabase
      .from('organization_tasks')
      .update(restoreFromArchivePatch())
      .eq('id', taskId);
    setRestoringId(null);
    if (upErr) {
      setError(upErr.message);
      return;
    }
    setArchiveItems((prev) => prev.filter((item) => item.id !== taskId));
    setArchiveCount((n) => Math.max(0, n - 1));
    await loadTasks({ silent: true });
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
      project_id: payload.project_id || null,
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
    await logActivity(supabase, 'task_updated', `Updated “${payload.title.trim()}”`, {
      taskId: payload.id,
    });
    setDetailTask(null);
    await loadTasks({ silent: true });
  };

  const createProject = async (e) => {
    e.preventDefault();
    if (!isAdmin || !newProjectName.trim() || !organizationId) return;
    setProjectBusy(true);
    const token = await getToken({ template: 'supabase' });
    setSupabaseAuthToken(token);
    const supabase = getSupabaseClient();
    const { data, error: err } = await supabase
      .from('organization_projects')
      .insert({
        organization_id: organizationId,
        name: newProjectName.trim(),
        created_by_user_id: currentUserId,
      })
      .select('id, name, status, owner_user_id')
      .maybeSingle();
    setProjectBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data) {
      setProjectList((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewProjectName('');
      await logActivity(supabase, 'project_created', `Created project “${data.name}”`, {
        projectId: data.id,
      });
    }
  };

  const formatDue = (due) => {
    if (!due) return null;
    return new Date(due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const canDrag = (task) => isAdmin || task.assignee_user_id === currentUserId;
  const columnLabel = ORG_TASK_COLUMNS.find((c) => c.key === assignModal.columnKey)?.label || 'To do';
  const activeFilterCount =
    (filterPriority !== 'all' ? 1 : 0)
    + (filterProject !== 'all' ? 1 : 0)
    + (isAdmin && filterAssignee !== 'all' ? 1 : 0);

  return (
    <div className="w-full min-w-0 max-w-full">
      <WorkspacePageHeader
        eyebrow="Work"
        title={isAdmin ? 'Delivery board' : 'My work'}
        description={
          isAdmin
            ? `${orgName ? `${orgName} · ` : ''}Assign, filter, and update live. Open a card for details.`
            : 'Your assignments. Drag to update status; open a card for details.'
        }
        actions={
          isAdmin ? (
            <WorkspaceSelect
              id="kanban-member-filter"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="w-full sm:w-44 block"
              size="sm"
              aria-label="Filter by member"
            >
              <option value="all">All members</option>
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.label}
                </option>
              ))}
            </WorkspaceSelect>
          ) : (
            <span className="text-[11px] rounded-md border border-border/70 bg-muted/40 text-muted-foreground font-semibold px-2.5 py-1.5 backdrop-blur-sm">
              Assigned to you
            </span>
          )
        }
      />

      <div className="ws-rise flex flex-wrap items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`inline-flex items-center gap-1.5 rounded-xl border px-3 h-9 text-xs font-semibold transition-colors ${
            showFilters || activeFilterCount
              ? 'border-[#5D3FD3]/35 bg-[rgba(93,63,211,0.08)] text-[#5D3FD3]'
              : 'border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <ListFilter className="h-3.5 w-3.5" aria-hidden />
          Filter{activeFilterCount ? ` (${activeFilterCount})` : ''}
        </button>
        <WorkspaceSelect
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value)}
          size="sm"
          className="w-[9.5rem]"
          aria-label="Sort tasks"
          leading={<ArrowDownUp className="h-3.5 w-3.5" aria-hidden />}
        >
          <option value="updated">Updated</option>
          <option value="due">Due date</option>
          <option value="priority">Priority</option>
          <option value="title">Title</option>
        </WorkspaceSelect>
        {isAdmin ? (
          <form onSubmit={createProject} className="flex flex-wrap items-center gap-2 ml-auto">
            <input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="New project"
              className="h-9 rounded-xl border border-border bg-card px-3 text-xs min-w-[120px] focus:outline-none focus:ring-2 focus:ring-[#5D3FD3]/25"
            />
            <button
              type="submit"
              disabled={projectBusy || !newProjectName.trim()}
              className="h-9 rounded-xl bg-[#5D3FD3] px-3 text-xs font-semibold text-white hover:bg-[#4c33b8] disabled:opacity-50"
            >
              Add
            </button>
          </form>
        ) : null}
      </div>

      {showFilters ? (
        <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-border bg-card p-3">
          <label className="text-xs font-medium text-muted-foreground flex flex-col gap-1.5">
            Priority
            <WorkspaceSelect
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              size="sm"
              className="w-32"
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </WorkspaceSelect>
          </label>
          <label className="text-xs font-medium text-muted-foreground flex flex-col gap-1.5">
            Project
            <WorkspaceSelect
              value={filterProject}
              onChange={(e) => setFilterProject(e.target.value)}
              size="sm"
              className="min-w-[10rem]"
            >
              <option value="all">All projects</option>
              <option value="none">No project</option>
              {projectList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </WorkspaceSelect>
          </label>
          <button
            type="button"
            onClick={() => {
              setFilterPriority('all');
              setFilterProject('all');
              if (isAdmin) setFilterAssignee('all');
            }}
            className="self-end text-xs font-semibold text-[#5D3FD3] hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="mb-4 text-sm text-red-700 rounded-xl border border-red-200 bg-red-50 px-4 py-2">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading board…
        </div>
      ) : (
        <div className="w-full min-w-0">
          <div className="ws-rise ws-rise-delay-2 flex md:grid md:grid-cols-3 w-full min-w-0 gap-3 sm:gap-4 lg:gap-5 md:min-h-[min(36rem,calc(100vh-14rem))] overflow-x-auto md:overflow-x-visible pb-1">
            {ORG_TASK_COLUMNS.map((col) => (
              <section
                key={col.key}
                className={`shrink-0 w-[min(18.5rem,85vw)] sm:w-[min(20rem,80vw)] md:w-auto md:min-w-0 flex flex-col h-full min-h-[min(26rem,calc(100vh-16rem))] md:min-h-0 rounded-2xl border border-border dark:border-white/[0.08] bg-card dark:bg-card/50 dark:backdrop-blur-md shadow-sm dark:shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_16px_36px_-16px_rgba(0,0,0,0.45)] ${
                  dragOverColumn === col.key ? 'ring-2 ring-[#5D3FD3]/35 bg-card' : ''
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
                <header className="px-3 py-2.5 border-b border-border/70 flex justify-between items-start gap-2 shrink-0">
                  <div className="min-w-0">
                    <h3
                      className={`text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 ${COLUMN_HEADER[col.key]}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${COLUMN_DOT[col.key]}`}
                        aria-hidden
                      />
                      {col.label}
                    </h3>
                    {col.key === 'done' ? (
                      <p className="mt-1 text-[10px] text-muted-foreground leading-snug">
                        Last {DONE_BOARD_RETENTION_DAYS} days on the board
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] font-semibold text-muted-foreground bg-muted/50 border border-border/70 px-2 py-0.5 rounded-md tabular-nums">
                      {tasksByColumn[col.key].length}
                    </span>
                  </div>
                </header>

                <ul className="p-2 space-y-2 flex-1 overflow-y-auto min-h-0">
                  {tasksByColumn[col.key].map((task) => (
                    <li
                      key={task.id}
                      draggable={canDrag(task)}
                      onDragStart={() => setDraggedTask(task)}
                      onDragEnd={() => {
                        setDraggedTask(null);
                        setDragOverColumn(null);
                      }}
                      onDoubleClick={() => setDetailTask(task)}
                      onClick={() => setDetailTask(task)}
                      className={`rounded-lg border border-border/80 bg-card p-2.5 space-y-1.5 transition-colors hover:border-[#5D3FD3]/30 ${
                        canDrag(task) ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
                      } ${draggedTask?.id === task.id ? 'opacity-50' : ''} ${
                        isOverdue(task) ? 'border-rose-300 dark:border-rose-500/40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {canDrag(task) ? (
                          <GripVertical className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                        ) : null}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>
                          {task.description ? (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          ) : null}
                        </div>
                        {task.column_key === 'done' && (isAdmin || task.assignee_user_id === currentUserId) ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void archiveTask(task);
                            }}
                            className="text-muted-foreground hover:text-[#5D3FD3] shrink-0"
                            aria-label="Archive"
                            title="Archive — keeps Insights"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        ) : isAdmin ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void requestDeleteTask(task);
                            }}
                            className="text-muted-foreground hover:text-red-600 shrink-0"
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
                        {task.project_id ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-100 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-500/30 font-medium">
                            {projectName(task.project_id) || 'Project'}
                          </span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F3F0FF] text-[#5D3FD3]/90 font-medium border border-[#5D3FD3]/12">
                            {task.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 pl-5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5D3FD3] text-[10px] font-bold text-white">
                            {labelInitials(memberLabel(members, task.assignee_user_id))}
                          </span>
                          <span className="text-xs font-medium text-foreground truncate">
                            {memberLabel(members, task.assignee_user_id)}
                          </span>
                        </div>
                        {task.due_date ? (
                          <p
                            className={`text-xs flex items-center gap-1 shrink-0 ${
                              isOverdue(task) ? 'text-rose-600 font-semibold' : 'text-muted-foreground'
                            }`}
                          >
                            <Calendar className="w-3 h-3" />
                            {formatDue(task.due_date)}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>

                {col.key === 'done' ? (
                  <div className="p-2 border-t border-border/70 shrink-0 flex flex-col gap-1.5">
                    {tasksByColumn.done.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setArchiveAllOpen(true)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-xs font-semibold text-muted-foreground hover:text-[#5D3FD3] hover:border-[#5D3FD3]/40 hover:bg-card transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" />
                        Archive all
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={openArchive}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-[#5D3FD3] dark:text-[#c4b5fd] hover:bg-[#5D3FD3]/8 transition-colors"
                    >
                      History{archiveCount > 0 ? ` (${archiveCount})` : ''}
                    </button>
                  </div>
                ) : isAdmin ? (
                  <div className="p-2 border-t border-border/70 shrink-0">
                    <button
                      type="button"
                      onClick={() => openAssignModal(col.key)}
                      className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs font-semibold text-muted-foreground hover:text-[#5D3FD3] hover:border-[#5D3FD3]/40 hover:bg-card transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Assign
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
        projects={projectList}
        saving={saving}
        onSubmit={handleCreate}
      />

      {detailTask ? (
        <TaskDetailDrawer
          key={detailTask.id}
          task={detailTask}
          isAdmin={isAdmin}
          members={members}
          projects={projectList}
          organizationId={organizationId}
          currentUserId={currentUserId}
          getToken={getToken}
          onClose={() => setDetailTask(null)}
          onSave={persistEdit}
          onDelete={isAdmin ? () => requestDeleteTask(detailTask) : null}
          onArchive={
            detailTask.column_key === 'done' &&
            (isAdmin || detailTask.assignee_user_id === currentUserId)
              ? () => archiveTask(detailTask)
              : null
          }
        />
      ) : null}

      <TaskArchiveDrawer
        open={archiveOpen}
        items={archiveItems}
        loading={archiveLoading}
        search={archiveSearch}
        onSearch={setArchiveSearch}
        onClose={() => setArchiveOpen(false)}
        onRestore={restoreArchivedTask}
        restoringId={restoringId}
        description={`Completions stay in Insights for the current reporting windows. Done stays on the board for ${DONE_BOARD_RETENTION_DAYS} days, then History for about ${ARCHIVED_TASK_RETENTION_DAYS} days. Older archive rows are removed so the database stays bounded.`}
      />

      <ConfirmModal
        open={archiveAllOpen}
        tone="archive"
        title="Archive all done tasks?"
        description={`They leave the board but stay in Insights. History keeps them for about ${ARCHIVED_TASK_RETENTION_DAYS} days, then they are removed.`}
        confirmLabel="Archive all"
        busy={archivingAll}
        onCancel={() => {
          if (!archivingAll) setArchiveAllOpen(false);
        }}
        onConfirm={confirmArchiveAllDone}
      />

      <ConfirmModal
        open={Boolean(taskToDelete)}
        title="Delete this task?"
        description={
          taskToDelete?.column_key === 'done' ? (
            <>
              Deleting{' '}
              <span className="font-semibold text-foreground">
                “{taskToDelete.title || 'this task'}”
              </span>{' '}
              removes that completion from Insights. Archive it instead if you only want it off the
              board.
            </>
          ) : taskToDelete?.title ? (
            <>
              <span className="font-semibold text-foreground">“{taskToDelete.title}”</span> will be
              permanently removed. This cannot be undone.
            </>
          ) : (
            'This task will be permanently removed. This cannot be undone.'
          )
        }
        confirmLabel="Delete task"
        busy={deletingTask}
        onCancel={() => {
          if (!deletingTask) setTaskToDelete(null);
        }}
        onConfirm={confirmDeleteTask}
      />
    </div>
  );
}

function TaskDetailDrawer({
  task,
  isAdmin,
  members,
  projects,
  organizationId,
  currentUserId,
  getToken,
  onClose,
  onSave,
  onDelete,
  onArchive,
}) {
  const [title, setTitle] = useState(task.title || '');
  const [description, setDescription] = useState(task.description || '');
  const [category, setCategory] = useState(task.category || 'General');
  const [priority, setPriority] = useState(task.priority || 'medium');
  const [dueDate, setDueDate] = useState(task.due_date ? task.due_date.split('T')[0] : '');
  const [assigneeUserId, setAssigneeUserId] = useState(task.assignee_user_id || '');
  const [projectId, setProjectId] = useState(task.project_id || '');
  const [comments, setComments] = useState([]);
  const [commentBody, setCommentBody] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    const token = await getToken({ template: 'supabase' });
    setSupabaseAuthToken(token);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setCommentsLoading(false);
      return;
    }
    const { data } = await supabase
      .from('organization_task_comments')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true });
    setComments(data || []);
    setCommentsLoading(false);
  }, [getToken, task.id]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) void loadComments();
    });
    return () => {
      cancelled = true;
    };
  }, [loadComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const due_iso = dueDate ? new Date(`${dueDate}T12:00:00`).toISOString() : null;
    await onSave({
      id: task.id,
      title,
      description,
      category,
      priority,
      due_date: due_iso,
      assignee_user_id: assigneeUserId,
      project_id: projectId || null,
    });
    setSaving(false);
  };

  const postComment = async (e) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setCommentBusy(true);
    const token = await getToken({ template: 'supabase' });
    setSupabaseAuthToken(token);
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('organization_task_comments').insert({
      organization_id: organizationId,
      task_id: task.id,
      author_user_id: currentUserId,
      body: commentBody.trim(),
    });
    setCommentBusy(false);
    if (!error) {
      setCommentBody('');
      await loadComments();
      await insertOrgActivityClient(supabase, {
        organizationId,
        actorUserId: currentUserId,
        eventType: 'task_comment',
        summary: `Commented on “${task.title}”`,
        metadata: { taskId: task.id },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button type="button" className="flex-1 min-w-0" aria-label="Close" onClick={onClose} />
      <div className="h-full w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground">Task details</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3 overflow-y-auto flex-1">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Description"
            className={`${inputClass} resize-none`}
          />
          <div className="grid grid-cols-2 gap-3">
            <DatePickerField
              value={dueDate}
              onChange={setDueDate}
              placeholder="Due date"
              aria-label="Due date"
              triggerClassName={inputClass}
            />
            <WorkspaceSelect
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full block"
              size="md"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </WorkspaceSelect>
          </div>
          <WorkspaceSelect
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full block"
            size="md"
          >
            <option value="General">General</option>
            <option value="Project">Project</option>
            <option value="Operations">Operations</option>
            <option value="Support">Support</option>
            <option value="Other">Other</option>
          </WorkspaceSelect>
          <WorkspaceSelect
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
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
          {isAdmin ? (
            <WorkspaceSelect
              value={assigneeUserId}
              onChange={(e) => setAssigneeUserId(e.target.value)}
              className="w-full block"
              size="md"
            >
              {members.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {m.label}
                </option>
              ))}
            </WorkspaceSelect>
          ) : null}

          <div className="flex gap-2 pt-1">
            {onArchive ? (
              <button
                type="button"
                onClick={() => void onArchive()}
                className="rounded-lg border border-border text-foreground px-3 py-2.5 text-sm font-medium hover:bg-muted inline-flex items-center gap-1.5"
              >
                <Archive className="h-3.5 w-3.5" />
                Archive
              </button>
            ) : null}
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                className="rounded-lg border border-rose-200 text-rose-700 px-3 py-2.5 text-sm font-medium hover:bg-rose-50"
              >
                Delete
              </button>
            ) : null}
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
              className="flex-1 rounded-lg bg-[#5D3FD3] hover:bg-[#5032c4] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <MessageSquare className="h-4 w-4 text-[#5D3FD3]" aria-hidden />
              Comments
            </h3>
            <ul className="space-y-2.5 mb-3 max-h-48 overflow-y-auto">
              {commentsLoading ? (
                <li className="text-xs text-muted-foreground">Loading comments…</li>
              ) : comments.length === 0 ? (
                <li className="text-xs text-muted-foreground">No comments yet.</li>
              ) : (
                comments.map((c) => (
                  <li key={c.id} className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{c.body}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {memberLabel(members, c.author_user_id)} ·{' '}
                      {new Date(c.created_at).toLocaleString()}
                    </p>
                  </li>
                ))
              )}
            </ul>
            <div className="flex gap-2">
              <input
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write a comment…"
                className={inputClass}
              />
              <button
                type="button"
                onClick={postComment}
                disabled={commentBusy || !commentBody.trim()}
                className="rounded-lg bg-[#5D3FD3] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
