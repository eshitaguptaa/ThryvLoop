import { clerkClient } from '@clerk/nextjs/server';
import { cache } from 'react';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { ensureWorkspaceInSupabase } from '@/lib/orgSync';

/** Base URL for invite redirects (set NEXT_PUBLIC_APP_URL to your ngrok URL in dev). */
export function getAppOrigin() {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url) return url.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export function decodeOrgSlug(orgSlug) {
  return decodeURIComponent(orgSlug);
}

/**
 * Readable workspace title in the UI. Supabase/clients sometimes persist the URL slug
 * (e.g. "acme-{longClerkUniquenessId}") into `name`; when it equals `slug`, drop the trailing
 * numeric suffix so headings match Clerk's chosen display name.
 */
export function workspaceDisplayName(name, slug) {
  const raw = typeof name === 'string' ? name.trim() : '';
  const s = typeof slug === 'string' ? slug.trim() : '';
  if (!raw) return 'Workspace';
  if (!s || raw !== s) return raw;

  const withoutSuffix = raw.replace(/-[0-9]{12,}$/, '');
  return withoutSuffix || raw;
}

async function hydrateMembershipOrgFromClerk(membership) {
  const org = membership?.organization;
  const orgId = org?.id;
  if (!orgId) return membership;

  let merged = { ...org };

  try {
    const client = await clerkClient();
    const getter = client.organizations?.getOrganization;
    if (typeof getter === 'function') {
      /** @type {{ name?: string; slug?: string } | undefined} */
      const full = await getter.call(client.organizations, { organizationId: orgId });
      if (full?.slug) merged.slug = full.slug;
      if (typeof full?.name === 'string' && full.name.trim()) {
        merged.name = full.name.trim();
      }
    }
  } catch (e) {
    console.warn('[org] hydrate org from Clerk failed:', e);
  }

  merged = {
    ...merged,
    name: workspaceDisplayName(merged.name, merged.slug),
  };

  return {
    ...membership,
    organization: merged,
  };
}

function membershipFromSupabase(orgRow, memberRow) {
  return {
    id: memberRow.clerk_organization_membership_id || `supabase_${orgRow.id}`,
    role: memberRow.role || 'org:member',
    organization: {
      id: orgRow.clerk_organization_id,
      name: orgRow.name,
      slug: orgRow.slug,
    },
  };
}

async function membershipFromClerk(userId, slug) {
  const client = await clerkClient();
  const list = await client.users.getOrganizationMembershipList({ userId, limit: 100 });
  return list.data.find((m) => m.organization.slug === slug) ?? null;
}

/**
 * Resolve workspace membership (Supabase mirror first, then Clerk API).
 * Cached per request to avoid duplicate Clerk calls across layout + page.
 */
export const getMembershipForSlug = cache(async (userId, orgSlug) => {
  if (!userId) return null;

  const slug = decodeOrgSlug(orgSlug);

  try {
    const supabase = createSupabaseAdmin();
    const { data: orgRow, error: orgErr } = await supabase
      .from('organizations')
      .select('id, clerk_organization_id, name, slug')
      .eq('slug', slug)
      .maybeSingle();

    if (!orgErr && orgRow) {
      const { data: memberRow, error: memErr } = await supabase
        .from('organization_members')
        .select('role, clerk_organization_membership_id')
        .eq('organization_id', orgRow.id)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();

      if (!memErr && memberRow) {
        return hydrateMembershipOrgFromClerk(
          membershipFromSupabase(orgRow, memberRow)
        );
      }
    }
  } catch (e) {
    console.error('[org] Supabase membership lookup failed:', e);
  }

  try {
    const found = await membershipFromClerk(userId, slug);
    if (!found) return null;
    return hydrateMembershipOrgFromClerk(found);
  } catch (e) {
    const message =
      e && typeof e === 'object' && 'message' in e && e.message
        ? String(e.message)
        : 'Clerk organization membership lookup failed';
    console.error('[org] Clerk getOrganizationMembershipList failed:', message, e);
    return null;
  }
});

export function isOrgAdmin(membership) {
  return membership?.role === 'org:admin';
}

async function membersFromSupabase(supabaseOrgId) {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from('organization_members')
    .select('user_id, role')
    .eq('organization_id', supabaseOrgId)
    .eq('status', 'active');

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.user_id,
    role: row.role,
    publicUserData: {
      userId: row.user_id,
      identifier: row.user_id,
    },
  }));
}

export const getOrgMembers = cache(async (organizationId) => {
  try {
    const client = await clerkClient();
    const { data } = await client.organizations.getOrganizationMembershipList({
      organizationId,
      limit: 100,
    });
    if (data?.length) return data;
  } catch (e) {
    console.error('[org] Clerk getOrgMembers failed, using Supabase fallback:', e);
  }

  try {
    const supabase = createSupabaseAdmin();
    const { data: orgRow } = await supabase
      .from('organizations')
      .select('id')
      .eq('clerk_organization_id', organizationId)
      .maybeSingle();
    if (orgRow?.id) {
      return await membersFromSupabase(orgRow.id);
    }
  } catch (e) {
    console.error('[org] Supabase members fallback failed:', e);
  }

  return [];
});

export async function getPendingInvitations(organizationId) {
  try {
    const client = await clerkClient();
    const { data } = await client.organizations.getOrganizationInvitationList({
      organizationId,
      status: ['pending'],
      limit: 100,
    });
    return data ?? [];
  } catch (e) {
    console.error('[org] getPendingInvitations failed:', e);
    return [];
  }
}

/** Clerk membership + Supabase tenant UUID (after webhook sync). */
export const getWorkspaceContext = cache(async (userId, orgSlug) => {
  const membership = await getMembershipForSlug(userId, orgSlug);
  if (!membership) return null;

  const supabase = createSupabaseAdmin();
  const { data: orgRow } = await supabase
    .from('organizations')
    .select('id')
    .eq('clerk_organization_id', membership.organization.id)
    .maybeSingle();

  let supabaseOrgId = orgRow?.id ?? null;
  if (!supabaseOrgId) {
    supabaseOrgId = await ensureWorkspaceInSupabase(membership, userId);
  }

  return {
    membership,
    clerkOrgId: membership.organization.id,
    slug: membership.organization.slug,
    name: membership.organization.name,
    supabaseOrgId,
  };
});
