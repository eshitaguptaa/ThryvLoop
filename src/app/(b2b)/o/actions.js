'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  getInviteRedirectOrigin,
  getMembershipForSlug,
  getOrgMembers,
  getPendingInvitations,
  getWorkspaceContext,
  isOrgAdmin,
} from '@/lib/org';
import { formatClerkActionError } from '@/lib/clerkErrors';
import { createAppNotificationsMany } from '@/lib/appNotifications';
import { logOrgActivity } from '@/lib/orgActivity';
import { parseFocusHours } from '@/lib/orgPulse';
import { authModalUrl } from '@/lib/authRoutes';
import { assertB2BWorkspacesEnabled } from '@/lib/featureFlags';
import { ensureWorkspaceInSupabase } from '@/lib/orgSync';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { parseWorkspaceLogoFile } from '@/lib/workspaceLogo';

function revalidateOrg(slug) {
  if (!slug) return;
  revalidatePath(`/o/${slug}`);
  revalidatePath(`/o/${slug}/work`);
  revalidatePath(`/o/${slug}/people`);
  revalidatePath(`/o/${slug}/insights`);
  revalidatePath(`/o/${slug}/settings`);
  revalidatePath(`/o/${slug}/rhythm`);
  revalidatePath(`/o/${slug}/members`);
  revalidatePath(`/o/${slug}/tasks`);
  revalidatePath(`/o/${slug}/analytics`);
}

export async function createWorkspace(_prevState, formData) {
  assertB2BWorkspacesEnabled();
  const { userId } = await auth();
  if (!userId) redirect(authModalUrl('signin'));

  const name = formData.get('name')?.toString()?.trim();
  if (!name || name.length < 2) {
    return { error: 'Workspace name must be at least 2 characters.' };
  }

  const { file: logoFile, error: logoError } = parseWorkspaceLogoFile(formData.get('logo'));
  if (logoError) return { error: logoError };

  const client = await clerkClient();
  let org;
  try {
    org = await client.organizations.createOrganization({
      name,
      createdBy: userId,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not create workspace.';
    return { error: message };
  }

  if (logoFile && org?.id) {
    try {
      await client.organizations.updateOrganizationLogo(org.id, {
        file: logoFile,
        uploaderUserId: userId,
      });
    } catch (e) {
      console.warn('[createWorkspace] logo upload failed:', e);
      // Workspace already created — continue; user can re-upload in Settings.
    }
  }

  redirect(`/o/${encodeURIComponent(org.slug)}`);
}

export async function inviteMember(orgSlug, _prevState, formData) {
  assertB2BWorkspacesEnabled();
  const { userId } = await auth();
  if (!userId) return { error: 'You must be signed in.' };

  const email = formData.get('email')?.toString()?.trim().toLowerCase();
  const role = formData.get('role')?.toString() || 'org:member';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Enter a valid email address.' };
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
  const organizationId = membership.organization.id;
  const origin = await getInviteRedirectOrigin();
  const redirectUrl = `${origin}/o/${encodeURIComponent(slug)}?from_invite=1`;

  try {
    const client = await clerkClient();

    const existingUsers = await client.users.getUserList({
      emailAddress: [email],
      limit: 5,
    });
    const invitedUser = existingUsers.data?.[0] ?? null;
    if (invitedUser?.id === userId) {
      return { error: 'You are already in this workspace.' };
    }
    if (invitedUser?.id) {
      const members = await getOrgMembers(organizationId);
      const alreadyMember = members.some((m) => {
        const memberId = m.publicUserData?.userId || m.publicUserData?.user_id;
        return memberId === invitedUser.id;
      });
      if (alreadyMember) {
        return { error: `${email} is already a member of this workspace.` };
      }
    }

    const pending = await getPendingInvitations(organizationId);
    const existingInvite = pending.find(
      (inv) => (inv.emailAddress || inv.email_address || '').toLowerCase() === email
    );
    let resent = false;
    if (existingInvite?.id) {
      await client.organizations.revokeOrganizationInvitation({
        organizationId,
        invitationId: existingInvite.id,
      });
      resent = true;
    }

    await client.organizations.createOrganizationInvitation({
      organizationId,
      inviterUserId: userId,
      emailAddress: email,
      role,
      redirectUrl,
    });

    const ctx = await getWorkspaceContext(userId, slug);
    if (ctx?.supabaseOrgId) {
      await logOrgActivity({
        organizationId: ctx.supabaseOrgId,
        actorUserId: userId,
        eventType: 'invite_sent',
        summary: resent
          ? `Resent invite to ${email} as ${role === 'org:admin' ? 'admin' : 'member'}`
          : `Invited ${email} as ${role === 'org:admin' ? 'admin' : 'member'}`,
        metadata: { email, role, resent },
      });
    }

    revalidateOrg(slug);
    return {
      success: true,
      message: resent
        ? `Invitation resent to ${email}.`
        : `Invitation sent to ${email}.`,
    };
  } catch (e) {
    return { error: formatClerkActionError(e, 'Could not send invitation.') };
  }
}

export async function revokeInvitation(orgSlug, invitationId) {
  assertB2BWorkspacesEnabled();
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
    return { error: formatClerkActionError(e, 'Could not revoke invitation.') };
  }

  revalidateOrg(membership.organization.slug);
  return { success: true };
}

export async function resendInvitation(orgSlug, invitationId) {
  assertB2BWorkspacesEnabled();
  const { userId } = await auth();
  if (!userId) return { error: 'You must be signed in.' };
  if (!invitationId) return { error: 'Missing invitation.' };

  const membership = await getMembershipForSlug(userId, orgSlug);
  if (!membership) return { error: 'Workspace not found.' };
  if (!isOrgAdmin(membership)) {
    return { error: 'Only workspace admins can resend invitations.' };
  }

  try {
    const client = await clerkClient();
    const pending = await getPendingInvitations(membership.organization.id);
    const existing = pending.find((inv) => inv.id === invitationId);
    if (!existing) return { error: 'Invitation not found or already accepted.' };

    const email = (existing.emailAddress || existing.email_address || '').toLowerCase();
    const role =
      existing.role === 'org:admin' || existing.role === 'org:member'
        ? existing.role
        : 'org:member';
    if (!email) return { error: 'Invitation is missing an email address.' };

    await client.organizations.revokeOrganizationInvitation({
      organizationId: membership.organization.id,
      invitationId,
    });

    const origin = await getInviteRedirectOrigin();
    await client.organizations.createOrganizationInvitation({
      organizationId: membership.organization.id,
      inviterUserId: userId,
      emailAddress: email,
      role,
      redirectUrl: `${origin}/o/${encodeURIComponent(membership.organization.slug)}?from_invite=1`,
    });

    const ctx = await getWorkspaceContext(userId, membership.organization.slug);
    if (ctx?.supabaseOrgId) {
      await logOrgActivity({
        organizationId: ctx.supabaseOrgId,
        actorUserId: userId,
        eventType: 'invite_sent',
        summary: `Resent invite to ${email} as ${role === 'org:admin' ? 'admin' : 'member'}`,
        metadata: { email, role, resent: true },
      });
    }
  } catch (e) {
    return { error: formatClerkActionError(e, 'Could not resend invitation.') };
  }

  revalidateOrg(membership.organization.slug);
  return { success: true };
}

export async function updateMemberRole(orgSlug, targetUserId, nextRole) {
  assertB2BWorkspacesEnabled();
  const { userId } = await auth();
  if (!userId) return { error: 'You must be signed in.' };
  if (!targetUserId) return { error: 'Missing member.' };
  if (nextRole !== 'org:member' && nextRole !== 'org:admin') {
    return { error: 'Invalid role.' };
  }
  if (targetUserId === userId && nextRole !== 'org:admin') {
    return { error: 'You cannot demote yourself. Ask another admin.' };
  }

  const membership = await getMembershipForSlug(userId, orgSlug);
  if (!membership) return { error: 'Workspace not found.' };
  if (!isOrgAdmin(membership)) {
    return { error: 'Only workspace admins can change roles.' };
  }

  try {
    const client = await clerkClient();
    const list = await client.organizations.getOrganizationMembershipList({
      organizationId: membership.organization.id,
      limit: 100,
    });
    const target = (list.data ?? []).find(
      (m) => (m.publicUserData?.userId || m.publicUserData?.user_id) === targetUserId
    );
    if (!target) return { error: 'Member not found.' };

    await client.organizations.updateOrganizationMembership({
      organizationId: membership.organization.id,
      userId: targetUserId,
      role: nextRole,
    });

    const ctx = await getWorkspaceContext(userId, membership.organization.slug);
    if (ctx?.supabaseOrgId) {
      await logOrgActivity({
        organizationId: ctx.supabaseOrgId,
        actorUserId: userId,
        eventType: 'role_changed',
        summary: `Updated a member role to ${nextRole === 'org:admin' ? 'Admin' : 'Member'}`,
        metadata: { targetUserId, role: nextRole },
      });
      try {
        const supabase = createSupabaseAdmin();
        await supabase
          .from('organization_members')
          .update({ role: nextRole, updated_at: new Date().toISOString() })
          .eq('organization_id', ctx.supabaseOrgId)
          .eq('user_id', targetUserId);
      } catch {
        /* webhook will sync */
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not update role.';
    return { error: message };
  }

  revalidateOrg(membership.organization.slug);
  return { success: true };
}

export async function removeMember(orgSlug, targetUserId) {
  assertB2BWorkspacesEnabled();
  const { userId } = await auth();
  if (!userId) return { error: 'You must be signed in.' };
  if (!targetUserId) return { error: 'Missing member.' };
  if (targetUserId === userId) {
    return { error: 'You cannot remove yourself. Use Leave workspace in Settings.' };
  }

  const membership = await getMembershipForSlug(userId, orgSlug);
  if (!membership) return { error: 'Workspace not found.' };
  if (!isOrgAdmin(membership)) {
    return { error: 'Only workspace admins can remove members.' };
  }

  try {
    const client = await clerkClient();
    await client.organizations.deleteOrganizationMembership({
      organizationId: membership.organization.id,
      userId: targetUserId,
    });

    const ctx = await getWorkspaceContext(userId, membership.organization.slug);
    if (ctx?.supabaseOrgId) {
      await logOrgActivity({
        organizationId: ctx.supabaseOrgId,
        actorUserId: userId,
        eventType: 'member_removed',
        summary: 'Removed a member from the workspace',
        metadata: { targetUserId },
      });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not remove member.';
    return { error: message };
  }

  revalidateOrg(membership.organization.slug);
  return { success: true };
}

export async function updateWorkspaceSettings(orgSlug, _prevState, formData) {
  assertB2BWorkspacesEnabled();
  const { userId } = await auth();
  if (!userId) return { error: 'You must be signed in.' };

  const membership = await getMembershipForSlug(userId, orgSlug);
  if (!membership) return { error: 'Workspace not found.' };
  if (!isOrgAdmin(membership)) {
    return { error: 'Only workspace admins can change settings.' };
  }

  const name = formData.get('name')?.toString()?.trim();
  const insightsPolicy = formData.get('insights_policy')?.toString() || 'team_only';
  if (insightsPolicy !== 'team_only' && insightsPolicy !== 'full_individual') {
    return { error: 'Invalid insights policy.' };
  }


  const focusEnabled =
    formData.get('focus_enabled') === 'on'
    || formData.get('focus_enabled') === 'true'
    || formData.get('focus_enabled') === '1';
  const focusTimezone = formData.get('focus_timezone')?.toString()?.trim() || 'UTC';
  let windows = [];
  try {
    const raw = formData.get('focus_windows')?.toString();
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) windows = parsed;
    }
  } catch {
    return { error: 'Invalid focus hours data.' };
  }

  const focusHours = parseFocusHours({
    enabled: focusEnabled,
    timezone: focusTimezone,
    windows,
  });

  try {
    const client = await clerkClient();
    if (name && name.length >= 2 && name !== membership.organization.name) {
      await client.organizations.updateOrganization(membership.organization.id, { name });
    }

    const { file: logoFile, error: logoError } = parseWorkspaceLogoFile(formData.get('logo'));
    if (logoError) return { error: logoError };

    if (formData.get('remove_logo') === '1') {
      try {
        await client.organizations.deleteOrganizationLogo(membership.organization.id);
      } catch (e) {
        console.warn('[settings] remove logo failed:', e);
      }
    } else if (logoFile) {
      await client.organizations.updateOrganizationLogo(membership.organization.id, {
        file: logoFile,
        uploaderUserId: userId,
      });
    }

    let supabaseOrgId = null;
    try {
      const ctx = await getWorkspaceContext(userId, membership.organization.slug);
      supabaseOrgId = ctx?.supabaseOrgId ?? null;
    } catch {
      supabaseOrgId = null;
    }
    if (!supabaseOrgId) {
      supabaseOrgId = await ensureWorkspaceInSupabase(membership, userId);
    }
    if (!supabaseOrgId) {
      return {
        error:
          'Workspace is not linked to the database. Apply organization migrations in Supabase, then try again.',
      };
    }

    const supabase = createSupabaseAdmin();

    const { data: beforeOrg } = await supabase
      .from('organizations')
      .select('insights_policy')
      .eq('id', supabaseOrgId)
      .maybeSingle();
    const previousPolicy =
      beforeOrg?.insights_policy === 'full_individual' ? 'full_individual' : 'team_only';
    const policyChanged = previousPolicy !== insightsPolicy;

    const patch = {
      insights_policy: insightsPolicy,
      focus_hours: focusHours,
      updated_at: new Date().toISOString(),
    };
    if (name && name.length >= 2) patch.name = name;

    const { error: upErr } = await supabase
      .from('organizations')
      .update(patch)
      .eq('id', supabaseOrgId);

    if (upErr) {
      return { error: upErr.message || 'Could not save workspace settings.' };
    }

    const orgName = name?.length >= 2 ? name : membership.organization.name;
    const orgSlug = membership.organization.slug;
    const homeLink = `/o/${encodeURIComponent(orgSlug)}`;

    await logOrgActivity({
      organizationId: supabaseOrgId,
      actorUserId: userId,
      eventType: policyChanged
        ? 'transparency_changed'
        : 'settings_updated',
      summary: policyChanged
        ? insightsPolicy === 'full_individual'
          ? 'Switched to full transparency mode'
          : 'Switched to team analytics only'
        : 'Updated workspace settings',
      metadata: {
        insightsPolicy,
        previousPolicy: policyChanged ? previousPolicy : undefined,
        focusEnabled,
        focusWindows: focusHours.windows?.length ?? 0,
        logoUpdated: Boolean(logoFile) || formData.get('remove_logo') === '1',
      },
    });

    if (policyChanged) {
      /** Every active teammate (incl. other admins) — exclude the editor. */
      /** @type {Set<string>} */
      const recipientIds = new Set();
      const { data: memberRows } = await supabase
        .from('organization_members')
        .select('user_id, role')
        .eq('organization_id', supabaseOrgId)
        .eq('status', 'active');
      for (const row of memberRows || []) {
        if (row.user_id && row.user_id !== userId) recipientIds.add(row.user_id);
      }
      try {
        const clerkMembers = await getOrgMembers(membership.organization.id);
        for (const m of clerkMembers) {
          const id = m.publicUserData?.userId;
          if (id && id !== userId) recipientIds.add(id);
        }
      } catch (e) {
        console.warn('[settings] clerk members for notify failed:', e);
      }

      const memberIds = [...recipientIds];
      const settingsLink = `${homeLink}/settings`;
      if (memberIds.length) {
        try {
          if (policyChanged) {
            const full = insightsPolicy === 'full_individual';
            await createAppNotificationsMany({
              userIds: memberIds,
              title: full ? 'Full transparency mode' : 'Team analytics only',
              body: full
                ? `${orgName}: admins can view member reports.`
                : `${orgName}: team-level analytics only.`,
              linkUrl: homeLink,
              linkLabel: 'Open workspace',
            });
          }
        } catch (notifyErr) {
          console.warn('[settings] policy/monitoring team notify failed:', notifyErr);
        }
      } else {
        console.warn('[settings] settings policy changed but no members to notify');
      }
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not save settings.';
    return { error: message };
  }

  revalidateOrg(membership.organization.slug);
  revalidatePath('/o');
  revalidatePath(`/o/${membership.organization.slug}/settings`);
  return { success: true, message: 'Settings saved.' };
}

async function purgeOrganizationFromSupabase(clerkOrganizationId) {
  if (!clerkOrganizationId) return;
  try {
    const supabase = createSupabaseAdmin();
    await supabase.from('organizations').delete().eq('clerk_organization_id', clerkOrganizationId);
  } catch (e) {
    console.error('[leave/delete] Supabase org purge failed:', e);
  }
}

async function purgeMembershipFromSupabase(clerkOrganizationId, memberUserId) {
  if (!clerkOrganizationId || !memberUserId) return;
  try {
    const supabase = createSupabaseAdmin();
    const { data: orgRow } = await supabase
      .from('organizations')
      .select('id')
      .eq('clerk_organization_id', clerkOrganizationId)
      .maybeSingle();
    if (!orgRow?.id) return;
    await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', orgRow.id)
      .eq('user_id', memberUserId);
  } catch (e) {
    console.error('[leave] Supabase membership purge failed:', e);
  }
}

export async function leaveWorkspace(orgSlug) {
  assertB2BWorkspacesEnabled();
  const { userId } = await auth();
  if (!userId) return { error: 'You must be signed in.' };

  const membership = await getMembershipForSlug(userId, orgSlug);
  if (!membership) return { error: 'Workspace not found.' };

  const clerkOrgId = membership.organization.id;
  let memberCount = 1;
  let adminCount = isOrgAdmin(membership) ? 1 : 0;

  try {
    const client = await clerkClient();
    const list = await client.organizations.getOrganizationMembershipList({
      organizationId: clerkOrgId,
      limit: 100,
    });
    memberCount = list.data?.length ?? 1;
    adminCount = (list.data ?? []).filter((m) => m.role === 'org:admin').length;
  } catch {
    /* fall through with defaults */
  }

  if (isOrgAdmin(membership) && adminCount <= 1 && memberCount > 1) {
    return {
      error:
        'You are the only admin. Promote another member before leaving, or delete the workspace.',
    };
  }

  try {
    const client = await clerkClient();
    // Last remaining member: delete the org (Clerk rejects leaving an empty org).
    if (memberCount <= 1) {
      await client.organizations.deleteOrganization(clerkOrgId);
      await purgeOrganizationFromSupabase(clerkOrgId);
    } else {
      await client.organizations.deleteOrganizationMembership({
        organizationId: clerkOrgId,
        userId,
      });
      await purgeMembershipFromSupabase(clerkOrgId, userId);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not leave workspace.';
    return { error: message };
  }

  revalidatePath('/o');
  revalidatePath(`/o/${orgSlug}`);
  return { success: true };
}

export async function deleteWorkspace(orgSlug) {
  assertB2BWorkspacesEnabled();
  const { userId } = await auth();
  if (!userId) return { error: 'You must be signed in.' };

  const membership = await getMembershipForSlug(userId, orgSlug);
  if (!membership) return { error: 'Workspace not found.' };
  if (!isOrgAdmin(membership)) {
    return { error: 'Only workspace admins can delete a workspace.' };
  }

  const clerkOrgId = membership.organization.id;

  try {
    const client = await clerkClient();
    await client.organizations.deleteOrganization(clerkOrgId);
    await purgeOrganizationFromSupabase(clerkOrgId);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Could not delete workspace.';
    return { error: message };
  }

  revalidatePath('/o');
  revalidatePath(`/o/${orgSlug}`);
  return { success: true };
}
