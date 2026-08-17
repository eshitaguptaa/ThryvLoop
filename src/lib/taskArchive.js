/** Days a completed task stays on the live Done column before auto-archive. */
export const DONE_BOARD_RETENTION_DAYS = 14;

/**
 * How long archived task rows are kept. Insights only needs ~120 days of
 * completions; History is useful for about a year. After this, rows are purged
 * so storage and query cost stay bounded.
 */
export const ARCHIVED_TASK_RETENTION_DAYS = 400;

/**
 * Local midnight cutoff: completed_at before this leaves the live board.
 * @param {Date} [now]
 * @param {number} [days]
 */
export function doneBoardCutoff(now = new Date(), days = DONE_BOARD_RETENTION_DAYS) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - Math.max(1, Number(days) || DONE_BOARD_RETENTION_DAYS));
  return d;
}

/**
 * archived_at before this is eligible for hard delete.
 * @param {Date} [now]
 * @param {number} [days]
 */
export function archivedTaskPurgeCutoff(now = new Date(), days = ARCHIVED_TASK_RETENTION_DAYS) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const n = Math.max(DONE_BOARD_RETENTION_DAYS + 1, Number(days) || ARCHIVED_TASK_RETENTION_DAYS);
  d.setDate(d.getDate() - n);
  return d;
}

function taskColumn(task) {
  return task?.column_key || task?.column || '';
}

function taskCompletedAt(task) {
  return task?.completed_at || task?.completedAt || null;
}

/** Live board rows only (archived work is History, not Kanban). */
export function isLiveBoardTask(task) {
  return !task?.archived_at && !task?.archivedAt;
}

/**
 * Done long enough to leave the board. Insights still use completed_at.
 * @param {Record<string, unknown> | null | undefined} task
 * @param {Date} [now]
 */
export function shouldAutoArchiveDoneTask(task, now = new Date()) {
  if (!task || !isLiveBoardTask(task)) return false;
  if (taskColumn(task) !== 'done') return false;
  const completed = taskCompletedAt(task);
  if (!completed) return false;
  const at = new Date(/** @type {string} */ (completed));
  if (Number.isNaN(at.getTime())) return false;
  return at < doneBoardCutoff(now);
}

/**
 * Archived long enough to drop the row. Open work is never purged.
 * @param {Record<string, unknown> | null | undefined} task
 * @param {Date} [now]
 */
export function shouldPurgeArchivedTask(task, now = new Date()) {
  const archived = task?.archived_at || task?.archivedAt;
  if (!archived) return false;
  if (taskColumn(task) && taskColumn(task) !== 'done') return false;
  const at = new Date(/** @type {string} */ (archived));
  if (Number.isNaN(at.getTime())) return false;
  return at < archivedTaskPurgeCutoff(now);
}

/** @param {Date} [now] */
export function archiveTimestampPatch(now = new Date()) {
  const iso = now.toISOString();
  return { archived_at: iso, updated_at: iso };
}

/** @param {Date} [now] */
export function restoreFromArchivePatch(now = new Date()) {
  return { archived_at: null, updated_at: now.toISOString() };
}
