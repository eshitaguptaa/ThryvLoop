/**
 * Archive vs Done-board visibility.
 * Run: node scripts/verify-task-archive.mjs
 */
import assert from 'assert';
import {
  DONE_BOARD_RETENTION_DAYS,
  ARCHIVED_TASK_RETENTION_DAYS,
  archiveTimestampPatch,
  archivedTaskPurgeCutoff,
  doneBoardCutoff,
  isLiveBoardTask,
  restoreFromArchivePatch,
  shouldAutoArchiveDoneTask,
  shouldPurgeArchivedTask,
} from '../src/lib/taskArchive.js';

const now = new Date('2026-08-16T12:00:00');
const cutoff = doneBoardCutoff(now, 14);
const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
eq(DONE_BOARD_RETENTION_DAYS, 14, 'retention days');
eq(cutoffKey, '2026-08-02', 'cutoff is 14 local days back');

eq(isLiveBoardTask({ column_key: 'done' }), true, 'unarchived is live');
eq(isLiveBoardTask({ archived_at: '2026-08-01T00:00:00.000Z' }), false, 'archived is not live');
eq(isLiveBoardTask({ archivedAt: '2026-08-01T00:00:00.000Z' }), false, 'client archivedAt is not live');

eq(
  shouldAutoArchiveDoneTask(
    { column_key: 'done', completed_at: '2026-08-10T10:00:00.000Z' },
    now
  ),
  false,
  'recent done stays on board'
);
eq(
  shouldAutoArchiveDoneTask(
    { column: 'done', completedAt: '2026-07-01T10:00:00.000Z' },
    now
  ),
  true,
  'old done auto-archives'
);
eq(
  shouldAutoArchiveDoneTask(
    { column_key: 'todo', completed_at: '2026-07-01T10:00:00.000Z' },
    now
  ),
  false,
  'open work never auto-archives'
);
eq(
  shouldAutoArchiveDoneTask(
    { column_key: 'done', completed_at: '2026-07-01T10:00:00.000Z', archived_at: '2026-08-01T00:00:00.000Z' },
    now
  ),
  false,
  'already archived is skipped'
);
eq(
  shouldAutoArchiveDoneTask({ column_key: 'done', completed_at: null }, now),
  false,
  'done without completed_at stays visible'
);

const patch = archiveTimestampPatch(now);
assert.ok(patch.archived_at, 'archive sets archived_at');
assert.equal(restoreFromArchivePatch(now).archived_at, null, 'restore clears archived_at');

eq(ARCHIVED_TASK_RETENTION_DAYS, 400, 'history retention is bounded');
const purgeKey = archivedTaskPurgeCutoff(now, 400);
const purgeDate = `${purgeKey.getFullYear()}-${String(purgeKey.getMonth() + 1).padStart(2, '0')}-${String(purgeKey.getDate()).padStart(2, '0')}`;
eq(purgeDate, '2025-07-12', 'purge cutoff is 400 local days back');

eq(
  shouldPurgeArchivedTask(
    { column_key: 'done', archived_at: '2025-01-01T00:00:00.000Z' },
    now
  ),
  true,
  'old archive is purged'
);
eq(
  shouldPurgeArchivedTask(
    { column_key: 'done', archived_at: '2026-08-01T00:00:00.000Z' },
    now
  ),
  false,
  'recent archive is kept'
);
eq(
  shouldPurgeArchivedTask({ column_key: 'todo', archived_at: '2025-01-01T00:00:00.000Z' }, now),
  false,
  'open work is never purged'
);

console.log('verify-task-archive: ok');

function eq(actual, expected, label) {
  assert.strictEqual(actual, expected, label);
}
