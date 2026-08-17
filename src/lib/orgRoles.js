/** Human-readable role labels (never show raw Clerk role strings in UI). */

export function formatOrgRole(role) {
  if (role === 'org:admin') return 'Admin';
  if (role === 'org:member') return 'Member';
  if (!role) return 'Member';
  return String(role).replace(/^org:/, '');
}

export function isAdminRole(role) {
  return role === 'org:admin';
}

/**
 * Who may open or download a member's personal productivity report.
 *
 * - Everyone may access **their own** report.
 * - Under **full_individual** transparency, only **workspace admins** may access
 *   **other members'** reports (never other admins').
 * - Normal members never access anyone else's report, even in full transparency.
 *
 * @param {{
 *   viewerIsAdmin: boolean,
 *   viewerUserId: string | null | undefined,
 *   subjectUserId: string | null | undefined,
 *   subjectRole?: string | null,
 *   insightsPolicy?: string | null,
 * }} args
 */
export function canAccessMemberPersonalReport({
  viewerIsAdmin,
  viewerUserId,
  subjectUserId,
  subjectRole = 'org:member',
  insightsPolicy = 'team_only',
}) {
  if (!subjectUserId || !viewerUserId) return false;
  if (subjectUserId === viewerUserId) return true;
  // Peer access: admin-only, full transparency, never into another admin.
  if (!viewerIsAdmin) return false;
  if (insightsPolicy !== 'full_individual') return false;
  if (isAdminRole(subjectRole)) return false;
  return true;
}
