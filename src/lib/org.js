import { clerkClient } from '@clerk/nextjs/server';
import { cache } from 'react';
import { headers } from 'next/headers';
import { B2B_WORKSPACES_ENABLED } from '@/lib/featureFlags';
import { canAccessMemberPersonalReport } from '@/lib/orgRoles';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { ensureWorkspaceInSupabase } from '@/lib/orgSync';

/** Base URL for invite redirects (set NEXT_PUBLIC_APP_URL to your ngrok URL in dev). */
export function getAppOrigin() {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (url) return url.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

function firstHeaderValue(value) {
  if (!value) return '';
  return value.split(',')[0].trim();
}

function isLocalhostOrigin(origin) {
  try {
    const { hostname } = new URL(origin);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

async function getRequestOrigin() {
  try {
    const h = await headers();
    const host = firstHeaderValue(h.get('x-forwarded-host') || h.get('host'));
    if (!host) return null;
    const proto = firstHeaderValue(
      h.get('x-forwarded-proto') || (host.includes('localhost') || host.startsWith('127.') ? 'http' : 'https')
    );
    return `${proto}://${host}`.replace(/\/$/, '');
  } catch {
    return null;
  }
}

/**
 * Origin used in Clerk invitation emails. Prefer the public host the admin is
 * actually on (tunnels / previews) so Gmail links open this deployment.
 */
export async function getInviteRedirectOrigin() {
  const requestOrigin = await getRequestOrigin();
  if (requestOrigin && !isLocalhostOrigin(requestOrigin)) return requestOrigin;
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (configured) return configured;
  if (requestOrigin) return requestOrigin;
  return getAppOrigin();
}

/** Name/slug for invite landing when the visitor is not a member yet. */
export async function getWorkspacePublicPreview(orgSlug) {
  const slug = decodeOrgSlug(orgSlug);
  try {
    const supabase = createSupabaseAdmin();
    const { data } = await supabase
      .from('organizations')
      .select('name, slug')
      .eq('slug', slug)
      .maybeSingle();
    if (data?.slug) {
      return {
        name: workspaceDisplayName(data.name, data.slug),
        slug: data.slug,
      };
    }
  } catch (e) {
    console.warn('[org] public workspace preview failed:', e);
  }
  return { name: workspaceDisplayName(slug, slug), slug };
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
      /** @type {{ name?: string; slug?: string; imageUrl?: string; hasImage?: boolean } | undefined} */
      const full = await getter.call(client.organizations, { organizationId: orgId });
      if (full?.slug) merged.slug = full.slug;
      if (typeof full?.name === 'string' && full.name.trim()) {
        merged.name = full.name.trim();
      }
      if (typeof full?.imageUrl === 'string') merged.imageUrl = full.imageUrl;
      if (typeof full?.hasImage === 'boolean') merged.hasImage = full.hasImage;
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
    /** @type {import('@clerk/backend').OrganizationMembership[]} */
    const all = [];
    let offset = 0;
    const limit = 100;
    for (let page = 0; page < 20; page += 1) {
      const { data } = await client.organizations.getOrganizationMembershipList({
        organizationId,
        limit,
        offset,
      });
      const batch = data ?? [];
      all.push(...batch);
      if (batch.length < limit) break;
      offset += limit;
    }
    if (all.length) return all;
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
  let res = await supabase
    .from('organizations')
    .select('id, insights_policy, focus_hours, name, slug')
    .eq('clerk_organization_id', membership.organization.id)
    .maybeSingle();

  if (res.error) {
    res = await supabase
      .from('organizations')
      .select('id')
      .eq('clerk_organization_id', membership.organization.id)
      .maybeSingle();
  }

  const orgRow = res.data;
  let supabaseOrgId = orgRow?.id ?? null;
  if (!supabaseOrgId) {
    supabaseOrgId = await ensureWorkspaceInSupabase(membership, userId);
  }

  let insightsPolicy =
    orgRow?.insights_policy === 'full_individual' ? 'full_individual' : 'team_only';
  let focusHours = orgRow?.focus_hours ?? null;

  return {
    membership,
    clerkOrgId: membership.organization.id,
    slug: membership.organization.slug,
    name: membership.organization.name,
    imageUrl:
      membership.organization.hasImage && membership.organization.imageUrl
        ? membership.organization.imageUrl
        : null,
    hasImage: Boolean(membership.organization.hasImage),
    supabaseOrgId,
    insightsPolicy,
    focusHours,
  };
});

/**
 * Whether the viewer may open / download a member's personal report PDF.
 * @see canAccessMemberPersonalReport — self always; peers only for admins under full transparency.
 */
export function canViewMemberAnalytics(args) {
  return canAccessMemberPersonalReport(args);
}
