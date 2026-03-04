import { auth } from '@clerk/nextjs/server';
import { createSupabaseClient } from '@/lib/supabaseClient';

/**
 * Generates sample focus_sessions for the last 14 days with varied times (peak hours).
 */
function generateSampleFocusSessions(userId) {
  const sessions = [];
  const now = new Date();
  const durationSeconds = 25 * 60; // 25 min

  // Peak hours: 8–10 and 14–17 (weekdays more)
  const preferredHours = [8, 9, 10, 14, 15, 16, 17];
  let sessionId = 0;
  for (let dayOffset = 13; dayOffset >= 0; dayOffset--) {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOffset);
    const day = date.getDay(); // 0 Sun, 6 Sat
    const isWeekend = day === 0 || day === 6;
    const count = isWeekend ? (dayOffset % 2 === 0 ? 1 : 0) : 2 + (dayOffset % 3);
    for (let i = 0; i < count; i++) {
      const hour = preferredHours[(dayOffset + i) % preferredHours.length];
      const completedAt = new Date(date);
      completedAt.setHours(hour, 30 + i * 5, 0, 0);
      const startedAt = new Date(completedAt.getTime() - durationSeconds * 1000);
      sessions.push({
        user_id: userId,
        started_at: startedAt.toISOString(),
        completed_at: completedAt.toISOString(),
        duration_seconds: durationSeconds,
        phase: 'session',
        mode: 'pomodoro',
      });
      sessionId++;
    }
  }
  return sessions;
}

/**
 * Generates sample tasks: some in progress, some done (with completed_at) for analytics.
 */
function generateSampleTasks(userId) {
  const now = new Date();
  const tasks = [
    { title: 'Review Q4 roadmap', category: 'Project', column_key: 'todaysFocus', priority: { level: 'High Priority', color: 'bg-red-500' } },
    { title: 'Update API docs', category: 'Dev', column_key: 'inProgress', priority: { level: 'Medium Priority', color: 'bg-orange-500' } },
    { title: 'Team standup notes', category: 'Other', column_key: 'backlog', priority: null },
    { title: 'Finalize budget deck', category: 'Finance', column_key: 'done', daysAgo: 1 },
    { title: 'Vendor API integration', category: 'Dev', column_key: 'done', daysAgo: 2 },
    { title: 'Competitor research', category: 'Marketing', column_key: 'done', daysAgo: 3 },
    { title: 'Design review', category: 'Design', column_key: 'done', daysAgo: 5 },
  ];

  return tasks.map((t) => {
    const completedAt = t.daysAgo != null
      ? (() => {
          const d = new Date(now);
          d.setDate(d.getDate() - t.daysAgo);
          d.setHours(16, 0, 0, 0);
          return d.toISOString();
        })()
      : null;
    const dueDate = t.column_key === 'todaysFocus' || t.column_key === 'inProgress'
      ? new Date(now.getTime() + 86400000).toISOString()
      : null;
    return {
      user_id: userId,
      title: t.title,
      category: t.category || 'Other',
      column_key: t.column_key,
      assigned_users: [],
      due_date: dueDate,
      priority: t.priority || null,
      completed_at: completedAt,
    };
  });
}

export async function POST() {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await getToken({ template: 'supabase' });
    const supabase = createSupabaseClient(token || undefined);
    if (!supabase) {
      return Response.json({ error: 'Database not configured' }, { status: 500 });
    }

    const focusSessions = generateSampleFocusSessions(userId);
    const tasks = generateSampleTasks(userId);

    const [sessionsRes, tasksRes] = await Promise.all([
      supabase.from('focus_sessions').insert(focusSessions).select('id'),
      supabase.from('tasks').insert(tasks).select('id'),
    ]);

    if (sessionsRes.error) {
      console.error('Seed focus_sessions error:', sessionsRes.error);
      return Response.json(
        { error: sessionsRes.error.message || 'Failed to seed focus sessions. Ensure the focus_sessions table exists.' },
        { status: 500 }
      );
    }
    if (tasksRes.error) {
      console.error('Seed tasks error:', tasksRes.error);
      return Response.json(
        { error: tasksRes.error.message || 'Failed to seed tasks. Ensure tasks table has completed_at column.' },
        { status: 500 }
      );
    }

    const sessionCount = sessionsRes.data?.length ?? focusSessions.length;
    const taskCount = tasksRes.data?.length ?? tasks.length;

    return Response.json({
      success: true,
      focus_sessions_added: sessionCount,
      tasks_added: taskCount,
    });
  } catch (err) {
    console.error('Seed insights error:', err);
    return Response.json(
      { error: err?.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}
