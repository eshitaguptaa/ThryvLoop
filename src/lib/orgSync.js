import { clerkClient } from '@clerk/nextjs/server';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';

function extractClerkUserId(member) {
  return (
    member?.publicUserData?.userId
    || member?.publicUserData?.user_id
    || member?.userId
    || null
  );
}

/**
 * Mirrors Clerk org + members into Supabase when webhooks were missed (common in local dev).
 * Returns Supabase organizations.id or null on failure.
 */
export async function ensureWorkspaceInSupabase(membership, userId) {
  const org = membership?.organization;
  if (!org?.id || !userId) return null;

  let clerkMembership = membership;
  if (!membership.id || String(membership.id).startsWith('session_')) {
    try {
      const client = await clerkClient();
      const list = await client.users.getOrganizationMembershipList({ userId, limit: 100 });
      const found = list.data?.find((m) => m.organization.id === org.id);
      if (found) clerkMembership = found;
    } catch (e) {
      console.error('[orgSync] Could not load Clerk membership for sync:', e);
    }
  }

  const supabase = createSupabaseAdmin();

  const { data: orgRow, error: orgErr } = await supabase
    .from('organizations')
    .upsert(
      {
        clerk_organization_id: org.id,
        name: org.name || 'Organization',
        slug: org.slug || org.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'clerk_organization_id' }
    )
    .select('id')
    .single();

  if (orgErr) {
    console.error(
      '[orgSync] organizations upsert failed. Did you run supabase/migrations/20250511164000_organizations.sql?',
      orgErr.message
    );
    return null;
  }

  const membershipId =
    clerkMembership.id && !String(clerkMembership.id).startsWith('session_')
      ? clerkMembership.id
      : `sync_${userId}_${org.id}`;

  const { error: memberErr } = await supabase.from('organization_members').upsert(
    {
      organization_id: orgRow.id,
      user_id: userId,
      role: clerkMembership.role || 'org:member',
      status: 'active',
      clerk_organization_membership_id: membershipId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id,user_id' }
  );

  if (memberErr) {
    console.error('[orgSync] organization_members upsert failed:', memberErr.message);
    return orgRow.id;
  }

  try {
    const client = await clerkClient();
    const { data: clerkMembers } = await client.organizations.getOrganizationMembershipList({
      organizationId: org.id,
      limit: 100,
    });

    for (const m of clerkMembers || []) {
      const memberUserId = extractClerkUserId(m);
      if (!memberUserId || !m.id) continue;
      await supabase.from('organization_members').upsert(
        {
          organization_id: orgRow.id,
          user_id: memberUserId,
          role: m.role || 'org:member',
          status: 'active',
          clerk_organization_membership_id: m.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id,user_id' }
      );
    }
  } catch (e) {
    console.error('[orgSync] Clerk member list sync skipped:', e);
  }

  return orgRow.id;
}
