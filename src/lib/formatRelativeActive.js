/**
 * Shared relative time label for workspace UI (client-safe).
 * @param {Date | string | null | undefined} input
 */
export function formatWorkspaceRelativeActive(input) {
  if (input == null || input === '') return null;
  const date = typeof input === 'string' ? new Date(input) : input instanceof Date ? input : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 45) return 'Active just now';
  if (sec < 3600) return `Active ${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `Active ${Math.floor(sec / 3600)}h ago`;
  if (sec < 604800) return `Active ${Math.floor(sec / 86400)}d ago`;
  return 'Active this week';
}
