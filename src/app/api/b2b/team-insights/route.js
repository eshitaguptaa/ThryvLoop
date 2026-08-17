import { NextResponse } from 'next/server';
import { fetchTeamInsightsPayload } from '@/lib/b2b/fetchTeamInsights';
import { normalizeTeamInsightsRangeDays } from '@/lib/b2b/teamInsights';
import { B2B_WORKSPACES_ENABLED } from '@/lib/featureFlags';
import { getOrgMembers, getWorkspaceContext } from '@/lib/org';
import { mapOrgMembersForTasks } from '@/lib/orgTasks';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/b2b/team-insights?orgSlug=&rangeDays=7|14|30
 * Aggregated team velocity + leaderboard for any active workspace member.
 */
export async function GET(request) {
  if (!B2B_WORKSPACES_ENABLED) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const viewerUserId = await getWorkspaceUserId();
  if (!viewerUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const orgSlug = searchParams.get('orgSlug')?.trim();
  const rangeDays = normalizeTeamInsightsRangeDays(searchParams.get('rangeDays'));

  if (!orgSlug) {
    return NextResponse.json({ error: 'orgSlug is required.' }, { status: 400 });
  }

  const ctx = await getWorkspaceContext(viewerUserId, orgSlug);
  if (!ctx) {
    return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
  }

  const clerkMembers = await getOrgMembers(ctx.clerkOrgId);
  const members = mapOrgMembersForTasks(clerkMembers);

  const { data, error } = await fetchTeamInsightsPayload({
    organizationId: ctx.supabaseOrgId,
    members,
    rangeDays,
  });

  if (error || !data) {
    return NextResponse.json({ error: error || 'Failed to load team insights' }, { status: 500 });
  }

  return NextResponse.json(
    {
      rangeDays: data.rangeDays,
      compareLabel: data.compareLabel,
      summary: data.summary,
      trends: data.trends,
      velocitySeries: data.velocitySeries,
      statusBreakdown: data.statusBreakdown,
      leaderboard: data.leaderboard,
      generatedAt: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}
