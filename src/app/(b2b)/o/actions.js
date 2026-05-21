'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  getAppOrigin,
  getMembershipForSlug,
  isOrgAdmin,
} from '@/lib/org';

export async function createWorkspace(_prevState, formData) {
  const { userId } = await auth();
  if (!userId) redirect('/signin');

  const name = formData.get('name')?.toString()?.trim();
  if (!name || name.length < 2) {
    return { error: 'Workspace name must be at least 2 characters.' };
  }

  const client = await clerkClient();
  const org = await client.organizations.createOrganization({
    name,
    createdBy: userId,
  });

  redirect(`/o/${encodeURIComponent(org.slug)}`);
}

export async function inviteMember(orgSlug, _prevState, formData) {
  const { userId } = await auth();
  if (!userId) return { error: 'You must be signed in.' };

  const email = formData.get('email')?.toString()?.trim().toLowerCase();
  const role = formData.get('role')?.toString() || 'org:member';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Enter a valid work email address.' };
  }

  if (role !== 'org:member' && role !== 'org:admin') {
    return { error: 'Invalid role.' };
  }

  const membership = await getMembershipForSlug(userId, orgSlug);
  if (!membership) return { error: 'Workspace not found.' };
  if (!isOrgAdmin(membership)) {
    return { error: 'Only workspace admins can send invitations.' };
  }

  const slug = membership.organization.slug;
  // Must land on a page that runs AcceptOrgInvitation (ticket query params).
  const redirectUrl = `${getAppOrigin()}/o/${encodeURIComponent(slug)}?from_invite=1`;

  try {
    const client = await clerkClient();
    await client.organizations.createOrganizationInvitation({
      organizationId: membership.organization.id,
      inviterUserId: userId,
      emailAddress: email,
      role,
      redirectUrl,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not send invitation.';
    return { error: message };
  }

  revalidatePath(`/o/${slug}/members`);
  return { success: true, message: `Invitation sent to ${email}.` };
}

export async function revokeInvitation(orgSlug, invitationId) {
  const { userId } = await auth();
  if (!userId) return { error: 'You must be signed in.' };

  const membership = await getMembershipForSlug(userId, orgSlug);
  if (!membership) return { error: 'Workspace not found.' };
  if (!isOrgAdmin(membership)) {
    return { error: 'Only workspace admins can revoke invitations.' };
  }

  try {
    const client = await clerkClient();
    await client.organizations.revokeOrganizationInvitation({
      organizationId: membership.organization.id,
      invitationId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not revoke invitation.';
    return { error: message };
  }

  revalidatePath(`/o/${membership.organization.slug}/members`);
  return { success: true };
}
