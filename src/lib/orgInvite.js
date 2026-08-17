import { hasInviteEmailProvider, sendWorkspaceInviteEmail } from '@/lib/inviteEmail';

export function inviterProfile(user) {
  const first = user?.firstName?.trim() || '';
  const last = user?.lastName?.trim() || '';
  const full = `${first} ${last}`.trim();
  const emails = user?.emailAddresses || [];
  const primary =
    emails.find((entry) => entry.id === user?.primaryEmailAddressId)?.emailAddress
    || emails[0]?.emailAddress
    || '';
  const name = full || (primary ? primary.split('@')[0] : '') || 'A teammate';
  return { name, email: String(primary).toLowerCase() };
}

/**
 * Create a Clerk org invitation and email a branded join link.
 * Clerk's own email is skipped when Resend is configured (`notify: false`).
 */
export async function createInvitationAndNotify({
  client,
  organizationId,
  inviterUserId,
  inviter,
  email,
  role,
  workspaceName,
  slug,
  origin,
}) {
  const joinUrl = `${origin}/o/${encodeURIComponent(slug)}?from_invite=1`;
  const useResend = hasInviteEmailProvider();

  const invitation = await client.organizations.createOrganizationInvitation({
    organizationId,
    inviterUserId,
    emailAddress: email,
    role,
    redirectUrl: joinUrl,
    notify: !useResend,
    expiresInDays: 14,
  });

  if (!useResend) {
    return { invitation, emailed: 'clerk' };
  }

  const sent = await sendWorkspaceInviteEmail({
    to: email,
    inviterName: inviter.name,
    inviterEmail: inviter.email,
    workspaceName,
    joinUrl,
    origin,
  });

  if (sent.ok) return { invitation, emailed: 'resend' };

  try {
    if (invitation?.id) {
      await client.organizations.revokeOrganizationInvitation({
        organizationId,
        invitationId: invitation.id,
      });
    }
    await client.organizations.createOrganizationInvitation({
      organizationId,
      inviterUserId,
      emailAddress: email,
      role,
      redirectUrl: joinUrl,
      notify: true,
      expiresInDays: 14,
    });
    return { invitation, emailed: 'clerk_fallback' };
  } catch (fallbackError) {
    console.error('[orgInvite] Clerk email fallback failed:', fallbackError);
    return { invitation, emailed: 'failed', error: 'Could not send the invite email. Try again in a moment.' };
  }
}
