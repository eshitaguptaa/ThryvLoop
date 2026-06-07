import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getWorkspaceCalendarEvents } from '@/lib/workspace/calendar';
import {
  createUserCalendarEvent,
  validateCalendarEventInput,
} from '@/lib/workspace/userCalendarEvents';
import { localDateKey, localEndOfDay, localStartOfDay } from '@/lib/dateRanges';
import { sumFocusSecondsInRange } from '@/lib/focusSessions';

const VALID_COLUMNS = new Set(['todaysFocus', 'inProgress', 'backlog', 'done']);

const PRIORITY_MAP = {
  high: { level: 'High Priority', color: 'bg-red-500', label: 'High' },
  medium: { level: 'Medium Priority', color: 'bg-orange-500', label: 'Medium' },
  low: { level: 'Low Priority', color: 'bg-gray-400', label: 'Low' },
};

/** Gemini function declarations */
export const ASSISTANT_TOOL_DECLARATIONS = [
  {
    name: 'get_tasks',
    description: 'Fetch the user open tasks from their task board.',
    parameters: {
      type: 'object',
      properties: {
        column: {
          type: 'string',
          description: 'Filter by column: todaysFocus, inProgress, backlog, done, or all',
        },
        priority: {
          type: 'string',
          description: 'Filter by priority: high, medium, low',
        },
        limit: { type: 'number', description: 'Max tasks to return (default 20)' },
      },
    },
  },
  {
    name: 'create_task',
    description: 'Create a new task for the user.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Task title' },
        column: {
          type: 'string',
          description: 'Column: todaysFocus, inProgress, backlog (default backlog)',
        },
        category: { type: 'string', description: 'Category e.g. Dev, Project, Other' },
        priority: { type: 'string', description: 'high, medium, or low' },
        due_date: { type: 'string', description: 'ISO 8601 due date/time (optional)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'update_task',
    description: 'Update a task: move to another column or mark complete.',
    parameters: {
      type: 'object',
      properties: {
        task_id: { type: 'string', description: 'Task UUID' },
        column: { type: 'string', description: 'New column key' },
        mark_complete: { type: 'boolean', description: 'Set true to mark task done' },
      },
      required: ['task_id'],
    },
  },
  {
    name: 'get_calendar_events',
    description: 'Get calendar events for a date range.',
    parameters: {
      type: 'object',
      properties: {
        start: { type: 'string', description: 'Range start ISO date/time (default: start of today)' },
        end: { type: 'string', description: 'Range end ISO date/time (default: end of today)' },
      },
    },
  },
  {
    name: 'create_focus_block',
    description: 'Schedule a focus/deep work block on the user calendar.',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Event title (default: Deep Work)' },
        starts_at: { type: 'string', description: 'Start time ISO 8601' },
        ends_at: { type: 'string', description: 'End time ISO 8601' },
        description: { type: 'string', description: 'Optional description' },
      },
      required: ['starts_at', 'ends_at'],
    },
  },
  {
    name: 'get_focus_summary',
    description: 'Get focus session stats for today or this week.',
    parameters: {
      type: 'object',
      properties: {
        period: { type: 'string', description: 'today or week (default today)' },
      },
    },
  },
];

function normalizePriority(priority) {
  if (!priority) return null;
  const key = String(priority).toLowerCase();
  return PRIORITY_MAP[key] || null;
}

function taskToCard(task) {
  return {
    type: 'task',
    id: task.id,
    title: task.title,
    column: task.column_key,
    dueDate: task.due_date,
    priority: task.priority?.level || null,
  };
}

function eventToCard(event) {
  return {
    type: 'event',
    id: event.id,
    title: event.title,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    showAs: event.showAs,
  };
}

async function execGetTasks(userId, args) {
  const supabase = createSupabaseAdmin();
  const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 50);
  let query = supabase
    .from('tasks')
    .select('id, title, column_key, category, due_date, priority, completed_at')
    .eq('user_id', userId)
    .is('completed_at', null)
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(limit);

  const column = args.column && args.column !== 'all' ? String(args.column) : null;
  if (column && VALID_COLUMNS.has(column)) {
    query = query.eq('column_key', column);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let tasks = data || [];
  const priorityFilter = args.priority ? String(args.priority).toLowerCase() : null;
  if (priorityFilter) {
    const level = PRIORITY_MAP[priorityFilter]?.level;
    if (level) {
      tasks = tasks.filter((t) => t.priority?.level === level);
    }
  }

  return {
    tasks: tasks.map((t) => ({
      id: t.id,
      title: t.title,
      column: t.column_key,
      category: t.category,
      due_date: t.due_date,
      priority: t.priority?.level || null,
    })),
    count: tasks.length,
    cards: tasks.slice(0, 5).map(taskToCard),
  };
}

async function execCreateTask(userId, args) {
  const title = typeof args.title === 'string' ? args.title.trim() : '';
  if (!title) throw new Error('Title is required');

  const column = args.column && VALID_COLUMNS.has(args.column) ? args.column : 'backlog';
  const category = typeof args.category === 'string' ? args.category.trim().slice(0, 100) : 'Other';
  const priority = normalizePriority(args.priority);
  let dueDate = null;
  if (args.due_date) {
    const d = new Date(args.due_date);
    if (!Number.isNaN(d.getTime())) dueDate = d.toISOString();
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      user_id: userId,
      title,
      column_key: column,
      category,
      priority,
      due_date: dueDate,
      assigned_users: [],
    })
    .select('id, title, column_key, due_date, priority')
    .single();

  if (error) throw new Error(error.message);

  return {
    success: true,
    task: {
      id: data.id,
      title: data.title,
      column: data.column_key,
      due_date: data.due_date,
      priority: data.priority?.level || null,
    },
    cards: [taskToCard(data)],
  };
}

async function execUpdateTask(userId, args) {
  const taskId = args.task_id;
  if (!taskId) throw new Error('task_id is required');

  const updates = { updated_at: new Date().toISOString() };
  if (args.column && VALID_COLUMNS.has(args.column)) {
    updates.column_key = args.column;
  }
  if (args.mark_complete === true) {
    updates.completed_at = new Date().toISOString();
    updates.column_key = 'done';
  }

  if (Object.keys(updates).length <= 1) {
    throw new Error('Provide column or mark_complete');
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .eq('user_id', userId)
    .select('id, title, column_key, completed_at')
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Task not found');

  return {
    success: true,
    task: {
      id: data.id,
      title: data.title,
      column: data.column_key,
      completed: Boolean(data.completed_at),
    },
    cards: [taskToCard(data)],
  };
}

async function execGetCalendarEvents(userId, args) {
  const now = new Date();
  const start = args.start ? new Date(args.start) : new Date(localStartOfDay(now));
  const end = args.end ? new Date(args.end) : new Date(localEndOfDay(now));

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid start or end date');
  }

  const data = await getWorkspaceCalendarEvents(userId, start, end);
  const events = (data.events || []).map((e) => ({
    id: e.id,
    title: e.title,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    showAs: e.showAs,
    source: e.source,
  }));

  return {
    events,
    count: events.length,
    hasConnection: data.hasConnection,
    cards: events.slice(0, 5).map(eventToCard),
  };
}

async function execCreateFocusBlock(userId, args) {
  const input = validateCalendarEventInput({
    title: args.title || 'Deep Work',
    startsAt: args.starts_at,
    endsAt: args.ends_at,
    description: args.description || 'Focus block scheduled by ThryvBot',
    showAs: 'busy',
  });

  const { event, googleSyncError } = await createUserCalendarEvent(userId, input);

  return {
    success: true,
    event: {
      id: event.id,
      title: event.title,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
    },
    googleSyncError: googleSyncError || null,
    cards: [eventToCard(event)],
  };
}

function formatFocusDuration(totalSeconds) {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  if (sec === 0) return '0 min';
  if (sec < 60) return `${sec} sec`;
  const minutes = Math.round(sec / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours} hr ${remainder} min` : `${hours} hr`;
}

async function execGetFocusSummary(userId, args) {
  const period = args.period === 'week' ? 'week' : 'today';
  const now = new Date();
  const supabase = createSupabaseAdmin();

  let startIso;
  let endIso;
  if (period === 'week') {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 6);
    startIso = localStartOfDay(weekAgo);
    endIso = localEndOfDay(now);
  } else {
    startIso = localStartOfDay(now);
    endIso = localEndOfDay(now);
  }

  const totalSecondsFromQuery = await sumFocusSecondsInRange(supabase, userId, startIso, endIso);

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('duration_seconds, completed_at')
    .eq('user_id', userId)
    .eq('phase', 'session')
    .gte('completed_at', startIso)
    .lte('completed_at', endIso);

  if (error) throw new Error(error.message);

  const rows = data || [];
  const sessionCount = rows.length;
  const summedFromRows = rows.reduce((sum, r) => sum + (Number(r.duration_seconds) || 0), 0);
  const totalSeconds = Math.max(totalSecondsFromQuery, summedFromRows);

  const minutes = totalSeconds >= 60 ? Math.round(totalSeconds / 60) : 0;

  let todayMinutes = minutes;
  if (period === 'week') {
    const todayKey = localDateKey(now);
    const todaySec = rows
      .filter((r) => localDateKey(new Date(r.completed_at)) === todayKey)
      .reduce((sum, r) => sum + (Number(r.duration_seconds) || 0), 0);
    todayMinutes = todaySec >= 60 ? Math.round(todaySec / 60) : 0;
  }

  const todaySeconds =
    period === 'week'
      ? rows
          .filter((r) => localDateKey(new Date(r.completed_at)) === localDateKey(now))
          .reduce((sum, r) => sum + (Number(r.duration_seconds) || 0), 0)
      : totalSeconds;

  const formatted = formatFocusDuration(totalSeconds);
  const summary =
    sessionCount === 0
      ? 'No focus sessions logged for this period.'
      : `${sessionCount} session${sessionCount === 1 ? '' : 's'}, ${formatted} total`;

  return {
    period,
    totalSeconds,
    totalMinutes: minutes,
    todayMinutes: period === 'week' ? todayMinutes : minutes,
    sessionCount,
    formatted,
    todayFormatted: formatFocusDuration(todaySeconds),
    summary,
    note:
      'Counts completed focus timer sessions logged in ThryvLoop. Active timer time may not be included until the session is saved.',
  };
}

/**
 * Execute a tool by name for the authenticated user.
 * @param {string} userId
 * @param {string} name
 * @param {Record<string, unknown>} args
 */
export async function executeAssistantTool(userId, name, args = {}) {
  switch (name) {
    case 'get_tasks':
      return execGetTasks(userId, args);
    case 'create_task':
      return execCreateTask(userId, args);
    case 'update_task':
      return execUpdateTask(userId, args);
    case 'get_calendar_events':
      return execGetCalendarEvents(userId, args);
    case 'create_focus_block':
      return execCreateFocusBlock(userId, args);
    case 'get_focus_summary':
      return execGetFocusSummary(userId, args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/** Collect cards from tool results for UI metadata */
export function collectCardsFromToolResults(toolResults) {
  /** @type {Array<{ type: string, [key: string]: unknown }>} */
  const cards = [];
  for (const result of toolResults) {
    if (result?.cards && Array.isArray(result.cards)) {
      cards.push(...result.cards);
    }
  }
  return cards.slice(0, 8);
}
