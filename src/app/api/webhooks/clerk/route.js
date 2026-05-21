import { Webhook } from 'svix';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';

function jsonResponse(body, status = 200) {
  return Response.json(body, { status });
}

async function upsertOrganization(supabase, orgPayload) {
  if (!orgPayload?.id) return null;
  const slug = orgPayload.slug || orgPayload.id;
  const name = orgPayload.name || 'Organization';
  const { data, error } = await supabase
    .from('organizations')
    .upsert(
      {
        clerk_organization_id: orgPayload.id,
        name,
        slug,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'clerk_organization_id' }
    )
    .select('id')
    .single();
  if (error) throw error;
  return data?.id ?? null;
}

async function getOrganizationUuidByClerkId(supabase, clerkOrgId) {
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('clerk_organization_id', clerkOrgId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

async function upsertMembership(supabase, { organizationId, userId, role, membershipId }) {
  if (!organizationId || !userId || !membershipId) return;
  const { error } = await supabase.from('organization_members').upsert(
    {
      organization_id: organizationId,
      user_id: userId,
      role: role || 'org:member',
      status: 'active',
      clerk_organization_membership_id: membershipId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'organization_id,user_id' }
  );
  if (error) throw error;
}

function extractOrgId(orgField) {
  if (!orgField) return null;
  if (typeof orgField === 'string') return orgField;
  return orgField.id ?? null;
}

function extractUserId(membershipData) {
  return (
    membershipData?.public_user_data?.user_id
    || membershipData?.public_user_data?.userId
    || membershipData?.user_id
    || membershipData?.userId
    || null
  );
}

/**
 * POST /api/webhooks/clerk
 * Configure in Clerk Dashboard → Webhooks with signing secret CLERK_WEBHOOK_SIGNING_SECRET.
 * Subscribe to: organization.*, organizationMembership.*, organizationInvitation.* (optional)
 */
export async function POST(req) {
  const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret) {
    return jsonResponse({ error: 'CLERK_WEBHOOK_SIGNING_SECRET is not set' }, 500);
  }

  const payloadString = await req.text();
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) {
    return jsonResponse({ error: 'Missing svix headers' }, 400);
  }

  let evt;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(payloadString, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch {
    return jsonResponse({ error: 'Invalid signature' }, 400);
  }

  const type = evt.type;
  const data = evt.data;

  try {
    const supabase = createSupabaseAdmin();
    switch (type) {
      case 'organization.created':
      case 'organization.updated': {
        await upsertOrganization(supabase, data);
        break;
      }
      case 'organization.deleted': {
        if (data?.id) {
          const { error } = await supabase
            .from('organizations')
            .delete()
            .eq('clerk_organization_id', data.id);
          if (error) throw error;
        }
        break;
      }
      case 'organizationMembership.created':
      case 'organizationMembership.updated': {
        const clerkOrgId = extractOrgId(data?.organization);
        if (data?.organization && typeof data.organization === 'object') {
          await upsertOrganization(supabase, data.organization);
        }
        let orgUuid = await getOrganizationUuidByClerkId(supabase, clerkOrgId);
        if (!orgUuid && clerkOrgId) {
          orgUuid = await upsertOrganization(supabase, { id: clerkOrgId, name: 'Organization', slug: clerkOrgId });
        }
        const userId = extractUserId(data);
        if (orgUuid && userId && data?.id) {
          await upsertMembership(supabase, {
            organizationId: orgUuid,
            userId,
            role: data.role,
            membershipId: data.id,
          });
        }
        break;
      }
      case 'organizationMembership.deleted': {
        if (data?.id) {
          const { error } = await supabase
            .from('organization_members')
            .delete()
            .eq('clerk_organization_membership_id', data.id);
          if (error) throw error;
        }
        break;
      }
      default:
        break;
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Webhook handler failed';
    return jsonResponse({ error: message }, 500);
  }

  return jsonResponse({ received: true });
}
