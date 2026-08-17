/**
 * User-facing messages from Clerk Backend / Frontend API errors.
 * @param {unknown} error
 * @param {string} fallback
 */
export function formatClerkActionError(error, fallback) {
  const clerkErrors = error && typeof error === 'object' && 'errors' in error
    ? error.errors
    : null;
  if (Array.isArray(clerkErrors) && clerkErrors.length > 0) {
    const first = clerkErrors[0] || {};
    const code = String(first.code || first.errorCode || '');
    const longMessage = String(first.longMessage || first.long_message || '');
    const message = String(first.message || '');
    const combined = `${longMessage} ${message} ${code}`.toLowerCase();

    if (code === 'duplicate_record' || combined.includes('already a pending invitation')) {
      return 'An invitation is already pending for this email.';
    }
    if (code === 'already_a_member_in_organization' || combined.includes('already a member')) {
      return 'That person is already a member of this workspace.';
    }
    if (
      combined.includes('redirect_url')
      || combined.includes('redirect url')
      || combined.includes('not a valid redirect')
      || combined.includes('allowed redirect')
    ) {
      return 'Invite link URL is not allowed in Clerk. Add this app URL under Clerk Dashboard → Paths → Allowed redirect URLs.';
    }
    if (combined.includes('organizations are not enabled')) {
      return 'Organizations are not enabled in Clerk. Turn them on in the Clerk Dashboard.';
    }
    return longMessage || message || fallback;
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
