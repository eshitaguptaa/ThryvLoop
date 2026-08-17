'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { X, Plus, Clock, User, Edit2, Trash2, ArrowRight, ArrowLeft, Check, Archive } from 'lucide-react';
import { getSupabaseClient, getUserStorageItem, setSupabaseAuthToken, setUserStorageItem } from '@/utils/userStorage';
import { useCelebration } from '@/contexts/CelebrationContext';
import TaskSelect from '@/components/tasks/TaskSelect';
import ThemeToolbarButton from '@/components/ThemeToolbarButton';
import ConfirmModal from '@/components/ui/ConfirmModal';
import DatePickerField from '@/components/ui/DatePickerField';
import TaskArchiveDrawer from '@/components/tasks/TaskArchiveDrawer';
import {
  archiveTimestampPatch,
  archivedTaskPurgeCutoff,
  DONE_BOARD_RETENTION_DAYS,
  ARCHIVED_TASK_RETENTION_DAYS,
  doneBoardCutoff,
  restoreFromArchivePatch,
} from '@/lib/taskArchive';
import {
  appSurfaceClass,
  appSurfaceInsetClass,
  appContentClass,
  appPageTitleClass,
  appMutedTextClass,
} from '@/lib/appShellClasses';

// Category colors mapping
const categoryColors = {
  'Finance': 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
  'Hiring': 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  'Dev': 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300',
  'Legal': 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300',
  'Project': 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300',
  'Marketing': 'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300',
  'Design': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-300',
  'Other': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
};

const taskModalFieldClass =
  'w-full px-4 py-3 bg-card text-foreground border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent';

const COLUMN_OPTIONS = [
  { value: 'todaysFocus', label: "Today's Focus" },
  { value: 'inProgress', label: 'In Progress' },
  { value: 'backlog', label: 'Backlog' },
];

const CATEGORY_OPTIONS = Object.keys(categoryColors).map((cat) => ({
  value: cat,
  label: cat,
}));

const priorityOptions = [
  { level: 'High Priority', color: 'bg-red-500', label: 'High' },
  { level: 'Medium Priority', color: 'bg-orange-500', label: 'Medium' },
  { level: 'Low Priority', color: 'bg-gray-400', label: 'Low' },
];

const PRIORITY_SELECT_OPTIONS = [
  { value: '', label: 'No Priority' },
  ...priorityOptions.map((opt) => ({
    value: opt.level,
    label: opt.label,
    color: opt.color,
  })),
];

const FILTER_PRIORITY_OPTIONS = [
  { value: 'all', label: 'All Priorities' },
  ...priorityOptions.map((opt) => ({
    value: opt.level,
    label: opt.label,
    color: opt.color,
  })),
  { value: 'none', label: 'No Priority' },
];

function renderCategoryChip(option) {
  if (!option) {
    return <span className="text-muted-foreground">Select category</span>;
  }
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${categoryColors[option.value] || categoryColors.Other}`}
    >
      {option.label}
    </span>
  );
}

function renderCategoryOption(option, isSelected) {
  return (
    <>
      {renderCategoryChip(option)}
      <span className="flex-1" />
      {isSelected ? (
        <Check className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden />
      ) : null}
    </>
  );
}

function renderPriorityOption(option, isSelected) {
  return (
    <>
      {option.color ? (
        <span className={`w-2 h-2 rounded-full shrink-0 ${option.color}`} aria-hidden />
      ) : (
        <span className="w-2 h-2 rounded-full shrink-0 border border-border" aria-hidden />
      )}
      <span className="flex-1 truncate">{option.label}</span>
      {isSelected ? (
        <Check className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden />
      ) : null}
    </>
  );
}

const emptyTasks = {
  todaysFocus: [],
  inProgress: [],
  backlog: [],
  done: [],
};

export default function TasksPage() {
  const { user } = useUser();
  const pathname = usePathname();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const userId = user?.id || null;
  const [tasks, setTasks] = useState(emptyTasks);
  const prevPathnameRef = useRef(pathname);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickCapture, setQuickCapture] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState('');
  const [clearConfirmColumn, setClearConfirmColumn] = useState(null);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deletingTask, setDeletingTask] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [archiveItems, setArchiveItems] = useState([]);
  const [archiveCount, setArchiveCount] = useState(0);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [restoringId, setRestoringId] = useState(null);
  const [archiveDoneOpen, setArchiveDoneOpen] = useState(false);
  const [archivingDone, setArchivingDone] = useState(false);
  
  const addTaskInProgressRef = useRef(false);
  const moveInProgressRef = useRef(new Set());
  const fetchInProgressRef = useRef(false);
  const fetchIdRef = useRef(0);
  const fetchCancelledRef = useRef(false);

  const getSupabase = () => getSupabaseClient();

  const taskIdMatches = (a, b) => String(a) === String(b);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedViewMode = getUserStorageItem(userId, 'tasks-view-mode', 'tasks-view-mode');
    if (savedViewMode) setViewMode(savedViewMode);
    const savedCategory = getUserStorageItem(userId, 'tasks-filter-category', 'tasks-filter-category');
    if (savedCategory) setFilterCategory(savedCategory);
    const savedPriority = getUserStorageItem(userId, 'tasks-filter-priority', 'tasks-filter-priority');
    if (savedPriority) setFilterPriority(savedPriority);
  }, [userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setUserStorageItem(userId, 'tasks-view-mode', viewMode);
  }, [viewMode, userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setUserStorageItem(userId, 'tasks-filter-category', filterCategory);
  }, [filterCategory, userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setUserStorageItem(userId, 'tasks-filter-priority', filterPriority);
  }, [filterPriority, userId]);

  // Format due time
  const formatDueTime = (dueDate) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Due ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays === -1) {
      return 'Yesterday';
    } else if (diffDays < 7 && diffDays > -7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const mapRowToTask = (row) => {
    const category = row.category || 'Other';
    return {
      id: row.id,
      category,
      categoryColor: categoryColors[category] || categoryColors['Other'],
      title: row.title,
      assignedUsers: row.assigned_users || [],
      dueTime: row.due_date ? formatDueTime(row.due_date) : null,
      dueDate: row.due_date || null,
      priority: row.priority || null,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
      column: row.column_key || 'backlog',
      completedAt: row.completed_at || null,
      archivedAt: row.archived_at || null,
    };
  };

  const groupTasksByColumn = (rows) => {
    const grouped = { todaysFocus: [], inProgress: [], backlog: [], done: [] };
    const taskList = rows.map((row) => mapRowToTask(row));
    const byId = new Map();
    taskList.forEach((task) => {
      const id = String(task?.id ?? '').trim();
      if (!id) return;
      const existing = byId.get(id);
      const taskUpdated = task.updatedAt || task.createdAt || '';
      const existingUpdated = existing?.updatedAt || existing?.createdAt || '';
      if (!existing || taskUpdated > existingUpdated) {
        byId.set(id, task);
      }
    });
    byId.forEach((task) => {
      if (task.archivedAt) return;
      const column = grouped[task.column] != null ? task.column : 'backlog';
      grouped[column].push(task);
    });
    return grouped;
  };

  const ensureSupabase = () => {
    const supabase = getSupabase();
    if (!supabase || !userId) {
      if (!supabase) {
        setTaskError('Supabase client not ready. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      } else if (!userId) {
        setTaskError('User not loaded. Please sign in again.');
      }
      return false;
    }
    return true;
  };

  const fetchTasks = async () => {
    if (fetchInProgressRef.current) return;
    const supabase = getSupabase();
    if (!ensureSupabase()) {
      setIsLoadingTasks(false);
      return;
    }
    fetchInProgressRef.current = true;
    const thisFetchId = ++fetchIdRef.current;
    setIsLoadingTasks(true);
    setTaskError('');
    try {
      const cutoffIso = doneBoardCutoff().toISOString();
      await supabase
        .from('tasks')
        .update(archiveTimestampPatch())
        .eq('user_id', userId)
        .eq('column_key', 'done')
        .is('archived_at', null)
        .lt('completed_at', cutoffIso);

      await supabase
        .from('tasks')
        .delete()
        .eq('user_id', userId)
        .eq('column_key', 'done')
        .not('archived_at', 'is', null)
        .lt('archived_at', archivedTaskPurgeCutoff().toISOString());

      const [{ data, error }, countRes] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', userId)
          .is('archived_at', null)
          .order('created_at', { ascending: true }),
        supabase
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .not('archived_at', 'is', null),
      ]);
      if (error) throw error;
      if (fetchIdRef.current !== thisFetchId || fetchCancelledRef.current) return;

      if (!countRes.error) setArchiveCount(countRes.count || 0);

      const next = !data || data.length === 0
        ? { todaysFocus: [], inProgress: [], backlog: [], done: [] }
        : groupTasksByColumn(data);
      setTasks(next);
    } catch (error) {
      if (fetchIdRef.current !== thisFetchId || fetchCancelledRef.current) return;
      const message = error?.message || error?.details || error?.hint || 'Unable to load tasks from Supabase.';
      console.error('Error loading tasks:', error, message);
      setTaskError(message);
    } finally {
      if (fetchIdRef.current === thisFetchId && !fetchCancelledRef.current) {
        setIsLoadingTasks(false);
      }
      fetchInProgressRef.current = false;
    }
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !userId) return;
    fetchCancelledRef.current = false;
    const ensureTokenAndFetch = async () => {
      const token = await getToken({ template: 'supabase' });
      if (!token) {
        setIsLoadingTasks(false);
        setTaskError('Supabase token unavailable. Check Clerk JWT template.');
        return;
      }
      setSupabaseAuthToken(token);
      await fetchTasks();
    };
    ensureTokenAndFetch();
    return () => {
      fetchCancelledRef.current = true;
    };
  }, [getToken, isLoaded, isSignedIn, userId]);

  useEffect(() => {
    const wasOnTasks = prevPathnameRef.current === '/tasks';
    const isOnTasks = pathname === '/tasks';
    prevPathnameRef.current = pathname;
    if (isOnTasks && !wasOnTasks && userId && isLoaded && isSignedIn) {
      fetchCancelledRef.current = false;
      const refetch = async () => {
        const token = await getToken({ template: 'supabase' });
        if (token) {
          setSupabaseAuthToken(token);
          await fetchTasks();
        }
      };
      refetch();
      return () => {
        fetchCancelledRef.current = true;
      };
    }
  }, [pathname, userId, isLoaded, isSignedIn, getToken]);

  const ensureFreshToken = async () => {
    const token = await getToken({ template: 'supabase' });
    if (token) setSupabaseAuthToken(token);
  };

  const addTask = async (taskData) => {
    if (addTaskInProgressRef.current) return;
    addTaskInProgressRef.current = true;
    await ensureFreshToken();
    const supabase = getSupabase();
    if (!ensureSupabase()) {
      addTaskInProgressRef.current = false;
      return;
    }
    setTaskError('');
    const row = {
      user_id: userId,
      title: taskData.title,
      category: taskData.category || 'Other',
      column_key: taskData.column || 'backlog',
      assigned_users: taskData.assignedUsers || [],
      due_date: taskData.dueDate || null,
      priority: taskData.priority || null,
    };
    try {
      const { data, error } = await supabase.from('tasks').insert(row).select('*').single();
      if (error) throw error;
      const task = mapRowToTask(data);
      setTasks((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((column) => {
          next[column] = next[column].filter((item) => item.id !== task.id);
        });
        const column = next[task.column] ? task.column : 'backlog';
        if (!next[column].some((t) => taskIdMatches(t.id, task.id))) {
          next[column] = [...next[column], task];
        }
        return next;
      });
    } catch (error) {
      console.error('Error adding task:', error);
      setTaskError('Unable to add task.');
    } finally {
      addTaskInProgressRef.current = false;
    }
  };

  const updateTask = async (taskId, updates) => {
    await ensureFreshToken();
    const supabase = getSupabase();
    if (!ensureSupabase()) {
      setTaskError('Could not connect. Please refresh the page.');
      return false;
    }
    setTaskError('');
    const payload = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.column !== undefined) {
      payload.column_key = updates.column;
      payload.completed_at = updates.column === 'done' ? new Date().toISOString() : null;
      if (updates.column !== 'done') payload.archived_at = null;
    }
    if (updates.assignedUsers !== undefined) payload.assigned_users = updates.assignedUsers;
    if (updates.dueDate !== undefined) payload.due_date = updates.dueDate ?? null;
    if (updates.priority !== undefined) payload.priority = updates.priority ?? null;
    
    try {
      const idForDb = typeof taskId === 'string' ? taskId : String(taskId);
      const { data, error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', idForDb)
        .eq('user_id', userId)
        .select('*');
      if (error) throw error;
      const row = Array.isArray(data) && data.length > 0 ? data[0] : null;
      if (!row) {
        throw new Error('Update matched no rows. Your session may have expired.');
      }
      const updatedTask = mapRowToTask(row);
      setTasks((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((col) => {
          next[col] = next[col].filter((t) => !taskIdMatches(t.id, taskId));
        });
        const toColumn = next[updatedTask.column] ? updatedTask.column : 'backlog';
        if (!next[toColumn].some(t => taskIdMatches(t.id, updatedTask.id))) {
            next[toColumn] = [...(next[toColumn] || []), updatedTask];
        }
        return next;
      });
      return true;
    } catch (error) {
      const msg = error?.message ?? 'Unable to update task. Try refreshing the page.';
      console.error('Error updating task:', error);
      setTaskError(msg);
      return false;
    }
  };

  const deleteTask = async (taskId) => {
    await ensureFreshToken();
    const supabase = getSupabase();
    if (!ensureSupabase()) return false;
    setTaskError('');
    const idForDb = typeof taskId === 'string' ? taskId : String(taskId);
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', idForDb).eq('user_id', userId);
      if (error) throw error;
      setTasks((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((col) => {
          next[col] = next[col].filter((t) => !taskIdMatches(t.id, taskId));
        });
        return next;
      });
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      setTaskError('Unable to delete task.');
      return false;
    }
  };

  const requestDeleteTask = (task) => {
    if (!task) return;
    setTaskToDelete(task);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete || deletingTask) return;
    setDeletingTask(true);
    const ok = await deleteTask(taskToDelete.id);
    setDeletingTask(false);
    if (ok) setTaskToDelete(null);
  };

  const loadArchive = async () => {
    await ensureFreshToken();
    const supabase = getSupabase();
    if (!ensureSupabase()) return;
    setArchiveLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, completed_at, archived_at, category')
      .eq('user_id', userId)
      .not('archived_at', 'is', null)
      .order('archived_at', { ascending: false })
      .limit(200);
    setArchiveLoading(false);
    if (error) {
      setTaskError(error.message);
      return;
    }
    const rows = data || [];
    setArchiveItems(
      rows.map((row) => ({
        id: row.id,
        title: row.title,
        completedAt: row.completed_at || row.archived_at,
        subtitle: row.category || '',
      }))
    );
    setArchiveCount(rows.length >= 200 ? archiveCount : rows.length);
  };

  const openArchive = () => {
    setArchiveSearch('');
    setArchiveOpen(true);
    void loadArchive();
  };

  const archiveTask = async (task) => {
    if (!task) return;
    await ensureFreshToken();
    const supabase = getSupabase();
    if (!ensureSupabase()) return;
    const patch = archiveTimestampPatch();
    const { error } = await supabase.from('tasks').update(patch).eq('id', task.id).eq('user_id', userId);
    if (error) {
      setTaskError(error.message);
      return;
    }
    setTasks((prev) => ({
      ...prev,
      done: (prev.done || []).filter((t) => !taskIdMatches(t.id, task.id)),
    }));
    setArchiveCount((n) => n + 1);
    if (archiveOpen) void loadArchive();
  };

  const confirmArchiveDone = async () => {
    const list = tasks.done || [];
    const ids = list.map((t) => t.id).filter(Boolean);
    if (ids.length === 0) {
      setArchiveDoneOpen(false);
      return;
    }
    setArchivingDone(true);
    await ensureFreshToken();
    const supabase = getSupabase();
    if (!ensureSupabase()) {
      setArchivingDone(false);
      return;
    }
    const { error } = await supabase
      .from('tasks')
      .update(archiveTimestampPatch())
      .in('id', ids)
      .eq('user_id', userId);
    setArchivingDone(false);
    if (error) {
      setTaskError(error.message);
      return;
    }
    setTasks((prev) => ({ ...prev, done: [] }));
    setArchiveCount((n) => n + ids.length);
    setArchiveDoneOpen(false);
    if (archiveOpen) void loadArchive();
  };

  const restoreArchivedTask = async (taskId) => {
    setRestoringId(taskId);
    await ensureFreshToken();
    const supabase = getSupabase();
    if (!ensureSupabase()) {
      setRestoringId(null);
      return;
    }
    const { error } = await supabase
      .from('tasks')
      .update(restoreFromArchivePatch())
      .eq('id', taskId)
      .eq('user_id', userId);
    setRestoringId(null);
    if (error) {
      setTaskError(error.message);
      return;
    }
    setArchiveItems((prev) => prev.filter((item) => item.id !== taskId));
    setArchiveCount((n) => Math.max(0, n - 1));
    await fetchTasks();
  };

  const clearAllTasks = async () => {
    if (!confirm('Delete all tasks? This cannot be undone.')) return;
    await ensureFreshToken();
    const supabase = getSupabase();
    if (!ensureSupabase()) return;
    try {
      const { error } = await supabase.from('tasks').delete().eq('user_id', userId);
      if (error) throw error;
      setTasks(emptyTasks);
      setTaskError('');
      setShowFilterMenu(false);
    } catch (error) {
      console.error('Error clearing tasks:', error);
      setTaskError('Unable to clear tasks.');
    }
  };

  const columnDisplayNames = {
    todaysFocus: "Today's Focus",
    inProgress: 'In Progress',
    backlog: 'Backlog',
    done: 'Done',
  };

  const openClearColumnConfirm = (columnKey) => {
    const list = tasks[columnKey] || [];
    if (list.length === 0) return;
    if (columnKey === 'done') {
      setArchiveDoneOpen(true);
      return;
    }
    setClearConfirmColumn(columnKey);
  };

  const clearColumn = async (columnKey) => {
    const list = tasks[columnKey] || [];
    if (list.length === 0) return;
    setClearConfirmColumn(null);
    await ensureFreshToken();
    const supabase = getSupabase();
    if (!ensureSupabase()) return;
    const ids = list.map((t) => t.id).filter(Boolean);
    if (ids.length === 0) return;
    try {
      const { error } = await supabase.from('tasks').delete().in('id', ids).eq('user_id', userId);
      if (error) throw error;
      setTasks((prev) => ({ ...prev, [columnKey]: [] }));
      setTaskError('');
    } catch (error) {
      console.error('Error clearing column:', error);
      setTaskError('Unable to clear column.');
    }
  };

  const moveTask = async (taskId, fromColumn, toColumn) => {
    if (fromColumn === toColumn) return;
    const idKey = `${taskId}::${fromColumn}::${toColumn}`;
    if (moveInProgressRef.current.has(idKey)) return;
    moveInProgressRef.current.add(idKey);
    
    let taskToMove = null;
    for (const col of Object.keys(tasks)) {
      const found = tasks[col].find((t) => taskIdMatches(t.id, taskId));
      if (found) {
        taskToMove = found;
        break;
      }
    }
    if (!taskToMove) {
      moveInProgressRef.current.delete(idKey);
      return;
    }
    
    const movedTask = { ...taskToMove, column: toColumn };
    
    // Optimistic Update
    setTasks((prev) => {
      const next = {
        todaysFocus: prev.todaysFocus.filter((t) => !taskIdMatches(t.id, taskId)),
        inProgress: prev.inProgress.filter((t) => !taskIdMatches(t.id, taskId)),
        backlog: prev.backlog.filter((t) => !taskIdMatches(t.id, taskId)),
        done: prev.done.filter((t) => !taskIdMatches(t.id, taskId)),
      };
      if (!next[toColumn].some(t => taskIdMatches(t.id, taskId))) {
          next[toColumn] = [...next[toColumn], movedTask];
      }
      return next;
    });
    
    try {
      const ok = await updateTask(taskId, { column: toColumn });
      if (!ok && taskToMove) {
        // Revert Update
        setTasks((prev) => {
          const next = {
            todaysFocus: prev.todaysFocus.filter((t) => !taskIdMatches(t.id, taskId)),
            inProgress: prev.inProgress.filter((t) => !taskIdMatches(t.id, taskId)),
            backlog: prev.backlog.filter((t) => !taskIdMatches(t.id, taskId)),
            done: prev.done.filter((t) => !taskIdMatches(t.id, taskId)),
          };
          next[fromColumn] = [...next[fromColumn], taskToMove];
          return next;
        });
        setTaskError('Could not save move. Please try again.');
      }
    } finally {
      moveInProgressRef.current.delete(idKey);
    }
  };

  const { showCelebration } = useCelebration();

  const completeTask = (task) => {
    const taskObj = typeof task === 'object' && task != null ? task : null;
    const taskId = taskObj?.id != null ? taskObj.id : (typeof task === 'string' || typeof task === 'number' ? task : null);
    const taskTitle = taskObj?.title ?? null;
    if (taskId == null || typeof taskId === 'object') return;

    setTasks((prev) => {
      const next = {
        todaysFocus: [...prev.todaysFocus],
        inProgress: [...prev.inProgress],
        backlog: [...prev.backlog],
        done: [...prev.done],
      };
      let taskToMove = null;
      for (const col of Object.keys(next)) {
        const found = next[col].find((t) => taskIdMatches(t.id, taskId));
        if (found) {
          taskToMove = found;
          break;
        }
      }
      if (!taskToMove) return prev;
      
      const movedTask = {
        ...taskToMove,
        column: 'done',
        completedAt: new Date().toISOString(),
      };
      Object.keys(next).forEach((col) => {
        next[col] = next[col].filter((t) => !taskIdMatches(t.id, taskId));
      });
      if (!next.done.some(t => taskIdMatches(t.id, taskId))) {
          next.done = [...next.done, movedTask];
      }
      return next;
    });
    showCelebration({ type: 'task', taskTitle: taskTitle ?? 'Task' });
    updateTask(taskId, { column: 'done' }).catch((err) => {
      console.error('Complete task failed:', err);
      setTaskError('Could not save to server.');
    });
  };

  const handleQuickCapture = (e) => {
    if (e.key === 'Enter' && quickCapture.trim()) {
      void addTask({
        title: quickCapture.trim(),
        column: 'backlog',
      });
      setQuickCapture('');
    }
  };

  const filterTasks = (taskList) => {
    let filtered = taskList;
    if (searchQuery.trim()) {
      filtered = filtered.filter((task) =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filterCategory !== 'all') {
      filtered = filtered.filter(task => task.category === filterCategory);
    }
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => {
        if (filterPriority === 'none') return !task.priority;
        return task.priority?.level === filterPriority;
      });
    }
    return filtered;
  };

  const dedupeTasks = (taskList) => {
    const seen = new Set();
    return taskList.filter((task) => {
      const id = String(task?.id ?? '').trim();
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  };

  const normalizeTasksForDisplay = (tasksObj) => {
    const seen = new Set();
    const colOrder = ['todaysFocus', 'inProgress', 'backlog', 'done'];
    const out = { todaysFocus: [], inProgress: [], backlog: [], done: [] };
    colOrder.forEach((col) => {
      const list = tasksObj[col] || [];
      out[col] = list.filter((t) => {
        const id = String(t?.id ?? '').trim();
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    });
    return out;
  };

  const normalizedTasks = normalizeTasksForDisplay(tasks);
  const categories = Array.from(new Set(
    Object.values(normalizedTasks).flat().map(t => t.category)
  ));

  const displayTodaysFocus = dedupeTasks(filterTasks(normalizedTasks.todaysFocus));
  const displayInProgress = dedupeTasks(filterTasks(normalizedTasks.inProgress));
  const displayBacklog = dedupeTasks(filterTasks(normalizedTasks.backlog));
  const highPriorityCount = [...displayTodaysFocus, ...displayInProgress, ...displayBacklog]
    .filter(t => t.priority?.level === 'High Priority').length;

  return (
    <div className={`${appSurfaceClass} ${appSurfaceInsetClass} font-(--font-poppins)`}>
      <div className={appContentClass}>
        <header className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 gap-4">
            <div className="flex-1">
              <h1 className={appPageTitleClass}>
                My Tasks
              </h1>
              <p className={`text-sm sm:text-base ${appMutedTextClass} mb-4`}>
                You have <span className="text-red-500 font-bold">{highPriorityCount} high-priority</span> tasks pending.
              </p>
              
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Quick capture"
                  value={quickCapture}
                  onChange={(e) => setQuickCapture(e.target.value)}
                  onKeyDown={handleQuickCapture}
                  className="w-full pl-4 pr-10 py-2.5 bg-card border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm text-foreground shadow-sm hover:shadow-md transition-shadow"
                />
                <button
                  onClick={() => {
                    if (quickCapture.trim()) {
                      void addTask({ title: quickCapture.trim(), column: 'backlog' });
                      setQuickCapture('');
                    }
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-muted-foreground transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:justify-end">
                <ThemeToolbarButton />
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground font-medium hidden sm:inline">View</span>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-xl transition-all ${
                      viewMode === 'list' 
                        ? 'bg-muted text-foreground shadow-sm' 
                        : 'bg-card text-muted-foreground hover:text-muted-foreground border-2 border-border shadow-sm hover:shadow-md'
                    }`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-xl transition-all ${
                      viewMode === 'grid' 
                        ? 'bg-muted text-foreground shadow-sm' 
                        : 'bg-card text-muted-foreground hover:text-muted-foreground border-2 border-border shadow-sm hover:shadow-md'
                    }`}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    setEditingTask(null);
                    setIsModalOpen(true);
                  }}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-all flex items-center gap-1.5 sm:gap-2 shadow-lg hover:shadow-xl text-xs sm:text-sm whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>New Task</span>
                </button>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="relative flex-1 min-w-0">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 bg-card border-2 border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-xs sm:text-sm text-foreground shadow-sm hover:shadow-md transition-shadow"
                  />
                </div>
                
                <div className="relative">
                  <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className="px-3 sm:px-4 py-2 sm:py-2.5 bg-card border-2 border-border rounded-xl hover:bg-muted/60 transition-all flex items-center gap-1.5 sm:gap-2 text-foreground font-medium shadow-sm hover:shadow-md text-xs sm:text-sm whitespace-nowrap"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span className="hidden sm:inline">Filter</span>
                    {(filterCategory !== 'all' || filterPriority !== 'all') && (
                      <span className="ml-1 w-2 h-2 bg-orange-500 rounded-full"></span>
                    )}
                  </button>
                  
                  {showFilterMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-card rounded-xl shadow-lg border-2 border-border p-4 z-50">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-2">Category</label>
                          <TaskSelect
                            size="sm"
                            value={filterCategory}
                            onChange={setFilterCategory}
                            aria-label="Filter by category"
                            options={[
                              { value: 'all', label: 'All Categories' },
                              ...categories.map((cat) => ({ value: cat, label: cat })),
                            ]}
                            renderValue={(selected) =>
                              selected?.value === 'all' || !selected ? (
                                <span className="truncate">All Categories</span>
                              ) : (
                                renderCategoryChip(selected)
                              )
                            }
                            renderOption={(option, isSelected) =>
                              option.value === 'all' ? (
                                <>
                                  <span className="flex-1 truncate">{option.label}</span>
                                  {isSelected ? (
                                    <Check className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden />
                                  ) : null}
                                </>
                              ) : (
                                renderCategoryOption(option, isSelected)
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-2">Priority</label>
                          <TaskSelect
                            size="sm"
                            value={filterPriority}
                            onChange={setFilterPriority}
                            aria-label="Filter by priority"
                            options={FILTER_PRIORITY_OPTIONS}
                            renderOption={renderPriorityOption}
                            renderValue={(selected) =>
                              selected ? (
                                <span className="truncate">{selected.label}</span>
                              ) : (
                                <span className="text-muted-foreground">All Priorities</span>
                              )
                            }
                          />
                        </div>
                        {(filterCategory !== 'all' || filterPriority !== 'all') && (
                          <button
                            onClick={() => {
                              setFilterCategory('all');
                              setFilterPriority('all');
                            }}
                            className="w-full px-3 py-2 text-sm text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                          >
                            Clear Filters
                          </button>
                        )}
                        <div className="border-t border-border pt-4 mt-4">
                          <button
                            onClick={clearAllTasks}
                            className="w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            Clear all tasks (start fresh)
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {taskError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {taskError}
          </div>
        )}

        {isLoadingTasks ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading tasks...</div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            <TaskColumn
              title="Today's Focus"
              color="purple"
              columnKey="todaysFocus"
              tasks={dedupeTasks(filterTasks(normalizedTasks.todaysFocus))}
              onMoveTask={(taskId, toColumn) => moveTask(taskId, 'todaysFocus', toColumn)}
              onCompleteTask={completeTask}
              onEditTask={(task) => {
                setEditingTask({ ...task, column: 'todaysFocus' });
                setIsModalOpen(true);
              }}
              onDeleteTask={requestDeleteTask}
              onArchiveTask={archiveTask}
              onOpenArchive={openArchive}
              archiveCount={archiveCount}
              onClearColumn={openClearColumnConfirm}
              draggedTask={draggedTask}
              draggedFromColumn={draggedFromColumn}
              dragOverColumn={dragOverColumn}
              onDragStart={(task, fromColumn) => {
                setDraggedTask(task);
                setDraggedFromColumn(fromColumn);
              }}
              onDragEnd={() => {
                setDraggedTask(null);
                setDraggedFromColumn(null);
                setDragOverColumn(null);
              }}
              onDragOver={(column) => setDragOverColumn(column)}
              onDrop={(toColumn) => {
                if (draggedTask && draggedFromColumn && toColumn !== draggedFromColumn) {
                  moveTask(draggedTask.id, draggedFromColumn, toColumn);
                }
                setDraggedTask(null);
                setDraggedFromColumn(null);
                setDragOverColumn(null);
              }}
              viewMode={viewMode}
            />

            <TaskColumn
              title="In Progress"
              color="orange"
              columnKey="inProgress"
              tasks={dedupeTasks(filterTasks(normalizedTasks.inProgress))}
              onMoveTask={(taskId, toColumn) => moveTask(taskId, 'inProgress', toColumn)}
              onCompleteTask={completeTask}
              onEditTask={(task) => {
                setEditingTask({ ...task, column: 'inProgress' });
                setIsModalOpen(true);
              }}
              onDeleteTask={requestDeleteTask}
              onArchiveTask={archiveTask}
              onOpenArchive={openArchive}
              archiveCount={archiveCount}
              onClearColumn={openClearColumnConfirm}
              draggedTask={draggedTask}
              draggedFromColumn={draggedFromColumn}
              dragOverColumn={dragOverColumn}
              onDragStart={(task, fromColumn) => {
                setDraggedTask(task);
                setDraggedFromColumn(fromColumn);
              }}
              onDragEnd={() => {
                setDraggedTask(null);
                setDraggedFromColumn(null);
                setDragOverColumn(null);
              }}
              onDragOver={(column) => setDragOverColumn(column)}
              onDrop={(toColumn) => {
                if (draggedTask && draggedFromColumn && toColumn !== draggedFromColumn) {
                  moveTask(draggedTask.id, draggedFromColumn, toColumn);
                }
                setDraggedTask(null);
                setDraggedFromColumn(null);
                setDragOverColumn(null);
              }}
              viewMode={viewMode}
            />

            <TaskColumn
              title="Backlog"
              color="gray"
              columnKey="backlog"
              tasks={dedupeTasks(filterTasks(normalizedTasks.backlog))}
              onMoveTask={(taskId, toColumn) => moveTask(taskId, 'backlog', toColumn)}
              onCompleteTask={completeTask}
              onEditTask={(task) => {
                setEditingTask({ ...task, column: 'backlog' });
                setIsModalOpen(true);
              }}
              onDeleteTask={requestDeleteTask}
              onArchiveTask={archiveTask}
              onOpenArchive={openArchive}
              archiveCount={archiveCount}
              onClearColumn={openClearColumnConfirm}
              draggedTask={draggedTask}
              draggedFromColumn={draggedFromColumn}
              dragOverColumn={dragOverColumn}
              onDragStart={(task, fromColumn) => {
                setDraggedTask(task);
                setDraggedFromColumn(fromColumn);
              }}
              onDragEnd={() => {
                setDraggedTask(null);
                setDraggedFromColumn(null);
                setDragOverColumn(null);
              }}
              onDragOver={(column) => setDragOverColumn(column)}
              onDrop={(toColumn) => {
                if (draggedTask && draggedFromColumn && toColumn !== draggedFromColumn) {
                  moveTask(draggedTask.id, draggedFromColumn, toColumn);
                }
                setDraggedTask(null);
                setDraggedFromColumn(null);
                setDragOverColumn(null);
              }}
              viewMode={viewMode}
            />

            <TaskColumn
              title="Done"
              color="green"
              columnKey="done"
              tasks={dedupeTasks(filterTasks(normalizedTasks.done))}
              onMoveTask={(taskId, toColumn) => moveTask(taskId, 'done', toColumn)}
              onCompleteTask={completeTask}
              onEditTask={(task) => {
                setEditingTask({ ...task, column: 'done' });
                setIsModalOpen(true);
              }}
              onDeleteTask={requestDeleteTask}
              onArchiveTask={archiveTask}
              onOpenArchive={openArchive}
              archiveCount={archiveCount}
              onClearColumn={openClearColumnConfirm}
              draggedTask={draggedTask}
              draggedFromColumn={draggedFromColumn}
              dragOverColumn={dragOverColumn}
              onDragStart={(task, fromColumn) => {
                setDraggedTask(task);
                setDraggedFromColumn(fromColumn);
              }}
              onDragEnd={() => {
                setDraggedTask(null);
                setDraggedFromColumn(null);
                setDragOverColumn(null);
              }}
              onDragOver={(column) => setDragOverColumn(column)}
              onDrop={(toColumn) => {
                if (draggedTask && draggedFromColumn && toColumn !== draggedFromColumn) {
                  moveTask(draggedTask.id, draggedFromColumn, toColumn);
                }
                setDraggedTask(null);
                setDraggedFromColumn(null);
                setDragOverColumn(null);
              }}
              viewMode={viewMode}
            />

          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-card rounded-xl p-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border-2 border-border">
              <div className="space-y-4">
                {/* Today's Focus List */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverColumn('todaysFocus');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggedTask && draggedFromColumn && 'todaysFocus' !== draggedFromColumn) {
                      moveTask(draggedTask.id, draggedFromColumn, 'todaysFocus');
                    }
                    setDraggedTask(null);
                    setDraggedFromColumn(null);
                    setDragOverColumn(null);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      if (dragOverColumn === 'todaysFocus') {
                        setDragOverColumn(null);
                      }
                    }
                  }}
                  className={`rounded-lg transition-all ${
                    dragOverColumn === 'todaysFocus' ? 'bg-blue-50 border-2 border-dashed border-blue-300 p-4' : 'p-0 border-2 border-transparent'
                  }`}
                >
                  {(dedupeTasks(filterTasks(normalizedTasks.todaysFocus)).length > 0 || dragOverColumn === 'todaysFocus') && (
                    <>
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 bg-purple-500 rounded-full shrink-0 shadow-sm"></div>
                          <h3 className="text-base font-bold text-foreground">Today's Focus</h3>
                          <span className="text-xs text-muted-foreground font-medium">({dedupeTasks(filterTasks(normalizedTasks.todaysFocus)).length})</span>
                        </div>
                        {dedupeTasks(filterTasks(normalizedTasks.todaysFocus)).length > 0 && (
                          <button
                            type="button"
                            onClick={() => openClearColumnConfirm('todaysFocus')}
                            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
                            title="Clear all tasks from Today's Focus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Clear all
                          </button>
                        )}
                      </div>
                      {dedupeTasks(filterTasks(normalizedTasks.todaysFocus)).length > 0 ? (
                        <div className="space-y-3">
                          {dedupeTasks(filterTasks(normalizedTasks.todaysFocus)).map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              currentColumn="todaysFocus"
                              onMoveTask={(taskId, toColumn) => moveTask(taskId, 'todaysFocus', toColumn)}
                              onCompleteTask={completeTask}
                              onEditTask={(task) => {
                                setEditingTask({ ...task, column: 'todaysFocus' });
                                setIsModalOpen(true);
                              }}
                              onDeleteTask={requestDeleteTask}
              onArchiveTask={archiveTask}
              onOpenArchive={openArchive}
                              onDragStart={(task, fromColumn) => {
                                setDraggedTask(task);
                                setDraggedFromColumn(fromColumn);
                              }}
                              onDragEnd={() => {
                                setDraggedTask(null);
                                setDraggedFromColumn(null);
                                setDragOverColumn(null);
                              }}
                              isDragging={draggedTask?.id === task.id}
                              viewMode={viewMode}
                            />
                          ))}
                        </div>
                      ) : (
                        dragOverColumn === 'todaysFocus' && (
                          <div className="text-center py-8 text-blue-500 font-medium text-sm">
                            Drop task here
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>

                {/* In Progress List */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverColumn('inProgress');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggedTask && draggedFromColumn && 'inProgress' !== draggedFromColumn) {
                      moveTask(draggedTask.id, draggedFromColumn, 'inProgress');
                    }
                    setDraggedTask(null);
                    setDraggedFromColumn(null);
                    setDragOverColumn(null);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      if (dragOverColumn === 'inProgress') {
                        setDragOverColumn(null);
                      }
                    }
                  }}
                  className={`rounded-lg transition-all ${
                    dragOverColumn === 'inProgress' ? 'bg-blue-50 border-2 border-dashed border-blue-300 p-4' : 'p-0 border-2 border-transparent'
                  }`}
                >
                  {(dedupeTasks(filterTasks(normalizedTasks.inProgress)).length > 0 || dragOverColumn === 'inProgress') && (
                    <>
                      <div className="flex items-center justify-between gap-2 mb-4 mt-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shrink-0 shadow-sm"></div>
                          <h3 className="text-base font-bold text-foreground">In Progress</h3>
                          <span className="text-xs text-muted-foreground font-medium">({dedupeTasks(filterTasks(normalizedTasks.inProgress)).length})</span>
                        </div>
                        {dedupeTasks(filterTasks(normalizedTasks.inProgress)).length > 0 && (
                          <button
                            type="button"
                            onClick={() => openClearColumnConfirm('inProgress')}
                            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
                            title="Clear all tasks from In Progress"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Clear all
                          </button>
                        )}
                      </div>
                      {dedupeTasks(filterTasks(normalizedTasks.inProgress)).length > 0 ? (
                        <div className="space-y-3">
                          {dedupeTasks(filterTasks(normalizedTasks.inProgress)).map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              currentColumn="inProgress"
                              onMoveTask={(taskId, toColumn) => moveTask(taskId, 'inProgress', toColumn)}
                              onCompleteTask={completeTask}
                              onEditTask={(task) => {
                                setEditingTask({ ...task, column: 'inProgress' });
                                setIsModalOpen(true);
                              }}
                              onDeleteTask={requestDeleteTask}
              onArchiveTask={archiveTask}
              onOpenArchive={openArchive}
                              onDragStart={(task, fromColumn) => {
                                setDraggedTask(task);
                                setDraggedFromColumn(fromColumn);
                              }}
                              onDragEnd={() => {
                                setDraggedTask(null);
                                setDraggedFromColumn(null);
                                setDragOverColumn(null);
                              }}
                              isDragging={draggedTask?.id === task.id}
                              viewMode={viewMode}
                            />
                          ))}
                        </div>
                      ) : (
                        dragOverColumn === 'inProgress' && (
                          <div className="text-center py-8 text-blue-500 font-medium text-sm">
                            Drop task here
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>

                {/* Backlog List */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverColumn('backlog');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggedTask && draggedFromColumn && 'backlog' !== draggedFromColumn) {
                      moveTask(draggedTask.id, draggedFromColumn, 'backlog');
                    }
                    setDraggedTask(null);
                    setDraggedFromColumn(null);
                    setDragOverColumn(null);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      if (dragOverColumn === 'backlog') {
                        setDragOverColumn(null);
                      }
                    }
                  }}
                  className={`rounded-lg transition-all ${
                    dragOverColumn === 'backlog' ? 'bg-blue-50 border-2 border-dashed border-blue-300 p-4' : 'p-0 border-2 border-transparent'
                  }`}
                >
                  {(dedupeTasks(filterTasks(normalizedTasks.backlog)).length > 0 || dragOverColumn === 'backlog') && (
                    <>
                      <div className="flex items-center justify-between gap-2 mb-4 mt-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 bg-gray-300 rounded-full shrink-0 shadow-sm"></div>
                          <h3 className="text-base font-bold text-foreground">Backlog</h3>
                          <span className="text-xs text-muted-foreground font-medium">({dedupeTasks(filterTasks(normalizedTasks.backlog)).length})</span>
                        </div>
                        {dedupeTasks(filterTasks(normalizedTasks.backlog)).length > 0 && (
                          <button
                            type="button"
                            onClick={() => openClearColumnConfirm('backlog')}
                            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
                            title="Clear all tasks from Backlog"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Clear all
                          </button>
                        )}
                      </div>
                      {dedupeTasks(filterTasks(normalizedTasks.backlog)).length > 0 ? (
                        <div className="space-y-3">
                          {dedupeTasks(filterTasks(normalizedTasks.backlog)).map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              currentColumn="backlog"
                              onMoveTask={(taskId, toColumn) => moveTask(taskId, 'backlog', toColumn)}
                              onCompleteTask={completeTask}
                              onEditTask={(task) => {
                                setEditingTask({ ...task, column: 'backlog' });
                                setIsModalOpen(true);
                              }}
                              onDeleteTask={requestDeleteTask}
              onArchiveTask={archiveTask}
              onOpenArchive={openArchive}
                              onDragStart={(task, fromColumn) => {
                                setDraggedTask(task);
                                setDraggedFromColumn(fromColumn);
                              }}
                              onDragEnd={() => {
                                setDraggedTask(null);
                                setDraggedFromColumn(null);
                                setDragOverColumn(null);
                              }}
                              isDragging={draggedTask?.id === task.id}
                              viewMode={viewMode}
                            />
                          ))}
                        </div>
                      ) : (
                        dragOverColumn === 'backlog' && (
                          <div className="text-center py-8 text-blue-500 font-medium text-sm">
                            Drop task here
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>

                {/* Done List */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverColumn('done');
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (draggedTask && draggedFromColumn && 'done' !== draggedFromColumn) {
                      moveTask(draggedTask.id, draggedFromColumn, 'done');
                    }
                    setDraggedTask(null);
                    setDraggedFromColumn(null);
                    setDragOverColumn(null);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      if (dragOverColumn === 'done') {
                        setDragOverColumn(null);
                      }
                    }
                  }}
                  className={`rounded-lg transition-all ${
                    dragOverColumn === 'done' ? 'bg-blue-50 border-2 border-dashed border-blue-300 p-4' : 'p-0 border-2 border-transparent'
                  }`}
                >
                  {(dedupeTasks(filterTasks(normalizedTasks.done)).length > 0 || dragOverColumn === 'done') && (
                    <>
                      <div className="flex items-center justify-between gap-2 mb-4 mt-6">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 bg-green-500 rounded-full shrink-0 shadow-sm"></div>
                          <h3 className="text-base font-bold text-foreground">Done</h3>
                          <span className="text-xs text-muted-foreground font-medium">({dedupeTasks(filterTasks(normalizedTasks.done)).length})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={openArchive}
                            className="shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#5D3FD3] dark:text-indigo-300 hover:bg-[#5D3FD3]/10 transition-colors"
                          >
                            History{archiveCount > 0 ? ` (${archiveCount})` : ''}
                          </button>
                          {dedupeTasks(filterTasks(normalizedTasks.done)).length > 0 ? (
                          <button
                            type="button"
                            onClick={() => openClearColumnConfirm('done')}
                            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-[#5D3FD3] hover:bg-[#5D3FD3]/10 border border-transparent hover:border-[#5D3FD3]/20 transition-colors"
                            title="Archive done tasks (keeps Insights)"
                          >
                            <Archive className="w-3.5 h-3.5" />
                            Archive all
                          </button>
                          ) : null}
                        </div>
                      </div>
                      {dedupeTasks(filterTasks(normalizedTasks.done)).length > 0 ? (
                        <div className="space-y-3">
                          {dedupeTasks(filterTasks(normalizedTasks.done)).map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              currentColumn="done"
                              onMoveTask={(taskId, toColumn) => moveTask(taskId, 'done', toColumn)}
                              onCompleteTask={completeTask}
                              onEditTask={(task) => {
                                setEditingTask({ ...task, column: 'done' });
                                setIsModalOpen(true);
                              }}
                              onDeleteTask={requestDeleteTask}
              onArchiveTask={archiveTask}
              onOpenArchive={openArchive}
                              onDragStart={(task, fromColumn) => {
                                setDraggedTask(task);
                                setDraggedFromColumn(fromColumn);
                              }}
                              onDragEnd={() => {
                                setDraggedTask(null);
                                setDraggedFromColumn(null);
                                setDragOverColumn(null);
                              }}
                              isDragging={draggedTask?.id === task.id}
                              viewMode={viewMode}
                            />
                          ))}
                        </div>
                      ) : (
                        dragOverColumn === 'done' && (
                          <div className="text-center py-8 text-blue-500 font-medium text-sm">
                            Drop task here
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>

                {/* Empty State */}
                {filterTasks(normalizedTasks.todaysFocus).length === 0 && 
                 filterTasks(normalizedTasks.inProgress).length === 0 && 
                 filterTasks(normalizedTasks.backlog).length === 0 &&
                 filterTasks(normalizedTasks.done).length === 0 &&
                 !dragOverColumn && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    No tasks found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTask(null);
          }}
          onSave={(taskData) => {
            if (editingTask) {
              updateTask(editingTask.id, taskData);
            } else {
              addTask(taskData);
            }
            setIsModalOpen(false);
            setEditingTask(null);
          }}
        />
      )}

      <ConfirmModal
        open={Boolean(taskToDelete)}
        title="Delete this task?"
        description={
          taskToDelete?.column === 'done' || taskToDelete?.completedAt ? (
            <>
              Deleting{' '}
              <span className="font-semibold text-foreground">
                “{taskToDelete.title || 'this task'}”
              </span>{' '}
              removes that completion from Analytics. Archive it instead if you only want it off the
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

      <ConfirmModal
        open={archiveDoneOpen}
        tone="archive"
        title="Archive done tasks?"
        description={`They leave the board but stay in Analytics. History keeps them for about ${ARCHIVED_TASK_RETENTION_DAYS} days, then they are removed.`}
        confirmLabel="Archive all"
        busy={archivingDone}
        onCancel={() => {
          if (!archivingDone) setArchiveDoneOpen(false);
        }}
        onConfirm={confirmArchiveDone}
      />

      <TaskArchiveDrawer
        open={archiveOpen}
        items={archiveItems}
        loading={archiveLoading}
        search={archiveSearch}
        onSearch={setArchiveSearch}
        onClose={() => setArchiveOpen(false)}
        onRestore={restoreArchivedTask}
        restoringId={restoringId}
        description={`Completions stay in Analytics for current reports. Done stays on the board for ${DONE_BOARD_RETENTION_DAYS} days, then History for about ${ARCHIVED_TASK_RETENTION_DAYS} days. Older archive rows are removed so storage stays bounded.`}
      />

      {clearConfirmColumn != null && (() => {
        const list = tasks[clearConfirmColumn] || [];
        const count = list.length;
        const name = columnDisplayNames[clearConfirmColumn] || clearConfirmColumn;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setClearConfirmColumn(null)}>
            <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Clear column?</h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {count} task{count === 1 ? '' : 's'} from {name}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                This cannot be undone. All tasks in this column will be permanently deleted.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setClearConfirmColumn(null)}
                  className="px-4 py-2.5 rounded-xl font-medium text-foreground bg-muted hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => clearColumn(clearConfirmColumn)}
                  className="px-4 py-2.5 rounded-xl font-medium text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear all
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showFilterMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowFilterMenu(false)}
        />
      )}
    </div>
  );
}

function TaskColumn({ 
  title, 
  color, 
  columnKey,
  tasks, 
  onMoveTask, 
  onCompleteTask, 
  onEditTask, 
  onDeleteTask,
  onArchiveTask,
  onOpenArchive,
  archiveCount = 0,
  onClearColumn,
  draggedTask,
  draggedFromColumn,
  dragOverColumn,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  viewMode = 'grid',
}) {
  const colorClasses = {
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    gray: 'bg-gray-300',
    green: 'bg-green-500',
  };

  const isDragOver = dragOverColumn === columnKey;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDragOver(columnKey);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDrop(columnKey);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) {
      if (dragOverColumn === columnKey) {
        onDragOver(null);
      }
    }
  };

  return (
    <div 
      className="flex flex-col"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    >
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-2.5 h-2.5 ${colorClasses[color]} rounded-full shrink-0 shadow-sm`}></div>
          <h2 className="text-base font-bold text-foreground truncate">{title}</h2>
          <span className="text-xs text-muted-foreground font-medium shrink-0">({tasks.length})</span>
        </div>
        {columnKey === 'done' ? (
          <div className="flex items-center gap-1 shrink-0">
            {onOpenArchive ? (
              <button
                type="button"
                onClick={onOpenArchive}
                className="shrink-0 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#5D3FD3] dark:text-indigo-300 hover:bg-[#5D3FD3]/10 transition-colors"
              >
                History{archiveCount > 0 ? ` (${archiveCount})` : ''}
              </button>
            ) : null}
            {onClearColumn && tasks.length > 0 ? (
              <button
                type="button"
                onClick={() => onClearColumn(columnKey)}
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-[#5D3FD3] hover:bg-[#5D3FD3]/10 border border-transparent hover:border-[#5D3FD3]/20 transition-colors"
                title="Archive done tasks — keeps Insights"
              >
                <Archive className="w-3.5 h-3.5" />
                Archive all
              </button>
            ) : null}
          </div>
        ) : onClearColumn && tasks.length > 0 ? (
          <button
            type="button"
            onClick={() => onClearColumn(columnKey)}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
            title={`Clear all tasks from ${title}`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear all
          </button>
        ) : null}
      </div>
      
      <div 
        className={`flex flex-col gap-4 min-h-[200px] transition-all duration-200 rounded-xl ${
          isDragOver 
            ? 'bg-blue-50 border-2 border-dashed border-blue-300 p-2' 
            : 'p-0 border-2 border-transparent'
        }`}
      >
        {tasks.length === 0 ? (
          <div className={`text-center py-8 text-muted-foreground text-sm ${isDragOver ? 'text-blue-500 font-medium' : ''}`}>
            {isDragOver ? 'Drop task here' : 'No tasks found'}
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              currentColumn={columnKey}
              onMoveTask={onMoveTask}
              onCompleteTask={onCompleteTask}
              onEditTask={onEditTask}
              onDeleteTask={onDeleteTask}
              onArchiveTask={onArchiveTask}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={draggedTask?.id === task.id}
            />
          ))
        )}
      </div>
    </div>
  );
}

function TaskCard({ 
  task, 
  currentColumn, 
  onMoveTask, 
  onCompleteTask, 
  onEditTask, 
  onDeleteTask,
  onArchiveTask,
  onDragStart,
  onDragEnd,
  isDragging,
  viewMode = 'grid',
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuOpenUpward, setMenuOpenUpward] = useState(false);
  const menuTriggerRef = useRef(null);

  const MENU_ESTIMATED_HEIGHT = 280;

  useLayoutEffect(() => {
    if (!showMenu || !menuTriggerRef.current) return;
    const rect = menuTriggerRef.current.getBoundingClientRect();
    const spaceBelow = typeof window !== 'undefined' ? window.innerHeight - rect.bottom : MENU_ESTIMATED_HEIGHT;
    setMenuOpenUpward(spaceBelow < MENU_ESTIMATED_HEIGHT);
  }, [showMenu]);

  const columnOptions = [
    { value: 'todaysFocus', label: "Today's Focus" },
    { value: 'inProgress', label: 'In Progress' },
    { value: 'backlog', label: 'Backlog' },
    { value: 'done', label: 'Done' },
  ].filter(opt => opt.value !== currentColumn);

  const handleDragStart = (e) => {
    const target = e.target;
    if (target.closest('button') || target.closest('[draggable="false"]') || showMenu) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id.toString());
    setTimeout(() => {
      onDragStart(task, currentColumn);
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.preventDefault();
    onDragEnd();
  };

  return (
    <div 
      draggable={!showMenu}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`bg-card rounded-xl p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.2)] transition-all duration-300 border-2 border-border relative group ${
        showMenu ? 'cursor-default' : 'cursor-move'
      } ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100'
      } ${
        viewMode === 'list' ? 'shadow-sm hover:shadow-md' : ''
      }`}
      style={showMenu ? { pointerEvents: 'none' } : {}}
    >
      <div 
        ref={menuTriggerRef}
        className="absolute top-4 right-4 z-10" 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ pointerEvents: 'auto' }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setShowMenu(!showMenu);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          draggable={false}
          className="w-5 h-5 flex items-center justify-center text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
        </button>
        
        {showMenu && (
          <div 
            className={`absolute right-0 w-48 bg-card rounded-lg shadow-xl border-2 border-border py-2 z-1000 pointer-events-auto ${menuOpenUpward ? 'bottom-full mb-2' : 'mt-2'}`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            draggable={false}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onEditTask(task);
                setShowMenu(false);
              }}
              draggable={false}
              className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 flex items-center gap-2 cursor-pointer transition-all duration-200 rounded-none first:rounded-t-lg"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </button>
            <div className="border-t border-border my-1"></div>
            <div className="px-2 py-1">
              <div className="text-xs font-semibold text-muted-foreground px-2 mb-1">Move to:</div>
              {columnOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onMoveTask(task.id, opt.value);
                    setShowMenu(false);
                  }}
                  draggable={false}
                  className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-blue-50 hover:text-blue-700 active:bg-blue-100 cursor-pointer transition-all duration-200 rounded-none"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {currentColumn !== 'done' && (
              <>
                <div className="border-t border-border my-1"></div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    onCompleteTask(task);
                    setShowMenu(false);
                  }}
                  draggable={false}
                  className="w-full px-4 py-2.5 text-left text-sm text-green-700 hover:bg-green-50 hover:text-green-800 active:bg-green-100 flex items-center gap-2 cursor-pointer transition-all duration-200 rounded-none"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Complete
                </button>
              </>
            )}
            {currentColumn === 'done' && onArchiveTask ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onArchiveTask(task);
                  setShowMenu(false);
                }}
                draggable={false}
                className="w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted flex items-center gap-2 cursor-pointer transition-all duration-200 rounded-none"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
            ) : null}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onDeleteTask(task);
                setShowMenu(false);
              }}
              draggable={false}
              className="w-full px-4 py-2.5 text-left text-sm text-red-700 hover:bg-red-50 hover:text-red-800 active:bg-red-100 flex items-center gap-2 cursor-pointer transition-all duration-200 rounded-none last:rounded-b-lg"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        )}
      </div>

      <div className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold mb-3 ${task.categoryColor}`}>
        {task.category}
      </div>

      <h3 className="text-base font-bold text-foreground mb-3 pr-8">
        {task.title}
      </h3>

      {task.priority && (
        <div className="flex items-center gap-2 mb-3">
          <div className={`w-1 h-4 ${task.priority.color} rounded-full`}></div>
          <span className="text-xs font-medium text-foreground">{task.priority.level}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        {task.dueTime && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{task.dueTime}</span>
          </div>
        )}
        
        {task.assignedUsers && task.assignedUsers.length > 0 && (
          <div className="flex items-center -space-x-2">
            {task.assignedUsers.map((user, index) => (
              <div
                key={index}
                className="w-7 h-7 rounded-full border-2 border-card overflow-hidden bg-muted"
                title={user.name}
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {showMenu && (
        <div
          className="fixed inset-0 z-999"
          onClick={() => setShowMenu(false)}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowMenu(false);
          }}
        />
      )}
    </div>
  );
}

function TaskModal({ task, onClose, onSave }) {
  const [title, setTitle] = useState(task?.title || '');
  const [category, setCategory] = useState(task?.category || 'Other');
  const [priority, setPriority] = useState(task?.priority?.level || '');
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.split('T')[0] : '');
  const [dueTime, setDueTime] = useState(task?.dueDate ? task.dueDate.split('T')[1]?.slice(0, 5) : '');
  const [column, setColumn] = useState(task?.column || 'backlog');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const dateTime = dueDate && dueTime
      ? new Date(`${dueDate}T${dueTime}`).toISOString()
      : dueDate
      ? new Date(`${dueDate}T12:00`).toISOString()
      : null;

    const priorityObj = priority
      ? priorityOptions.find(p => p.level === priority)
      : null;

    onSave({
      title: title.trim(),
      category,
      priority: priorityObj,
      dueDate: dateTime,
      column,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            {task ? 'Edit Task' : 'New Task'}
          </h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-muted-foreground transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Task Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className={taskModalFieldClass}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Category</label>
              <TaskSelect
                value={category}
                onChange={setCategory}
                aria-label="Task category"
                options={CATEGORY_OPTIONS}
                renderValue={(_, val) => renderCategoryChip(CATEGORY_OPTIONS.find((o) => o.value === val))}
                renderOption={renderCategoryOption}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Priority</label>
              <TaskSelect
                value={priority}
                onChange={setPriority}
                aria-label="Task priority"
                placeholder="No Priority"
                options={PRIORITY_SELECT_OPTIONS}
                renderValue={(selected) =>
                  selected ? (
                    <span className="flex items-center gap-2 truncate">
                      {selected.color ? (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${selected.color}`} aria-hidden />
                      ) : null}
                      {selected.label}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">No Priority</span>
                  )
                }
                renderOption={renderPriorityOption}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Due Date</label>
              <DatePickerField
                value={dueDate}
                onChange={setDueDate}
                tone="orange"
                placeholder="No due date"
                aria-label="Due date"
                triggerClassName={taskModalFieldClass}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Due Time</label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className={taskModalFieldClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">Column</label>
            <TaskSelect
              value={column}
              onChange={setColumn}
              aria-label="Task column"
              options={COLUMN_OPTIONS}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border-2 border-border rounded-xl text-foreground font-medium hover:bg-muted/60 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-medium transition-colors shadow-lg"
            >
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}