import { NextResponse } from 'next/server';
import { buildAnalyticsInsight } from '@/lib/assistant/gemini';
import { generateAnalyticsPdf } from '@/lib/analysis/generatePdf';
import { buildPersonalAnalysisReportPayload } from '@/lib/analysis/buildPersonalAnalysisReportPayload';
import { B2B_WORKSPACES_ENABLED } from '@/lib/featureFlags';
import {
  getOrgMembers,
  getWorkspaceContext,
  isOrgAdmin,
} from '@/lib/org';
import { canAccessMemberPersonalReport } from '@/lib/orgRoles';
import { mapOrgMembersForTasks, memberLabel } from '@/lib/orgTasks';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * GET /api/b2b/member-report?orgSlug=&memberUserId=
 * Downloads the same Analytics-page productivity PDF for a team member.
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
  const memberUserId = searchParams.get('memberUserId')?.trim();

  if (!orgSlug || !memberUserId) {
    return NextResponse.json({ error: 'orgSlug and memberUserId are required.' }, { status: 400 });
  }

  const ctx = await getWorkspaceContext(viewerUserId, orgSlug);
  if (!ctx) {
    return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
  }

  const admin = isOrgAdmin(ctx.membership);
  const selfView = memberUserId === viewerUserId;
  const clerkMembers = await getOrgMembers(ctx.clerkOrgId);
  const members = mapOrgMembersForTasks(clerkMembers);
  const subject = members.find((m) => m.userId === memberUserId);
  if (!subject) {
    return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
  }

  const subjectMembership = clerkMembers.find(
    (m) => (m.publicUserData?.userId || m.publicUserData?.user_id) === memberUserId
  );
  const subjectRole = subjectMembership?.role || 'org:member';

  const allowed = canAccessMemberPersonalReport({
    viewerIsAdmin: admin,
    viewerUserId,
    subjectUserId: memberUserId,
    subjectRole,
    insightsPolicy: ctx.insightsPolicy,
  });

  if (!allowed) {
    return NextResponse.json(
      { error: 'Only admins can download other members’ personal reports under full transparency.' },
      { status: 403 }
    );
  }

  const supabase = createSupabaseAdmin();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const [tasksRes, sessionsRes] = await Promise.all([
    supabase
      .from('tasks')
      .select('*')
      .eq('user_id', memberUserId)
      .order('created_at', { ascending: true })
      .limit(800),
    supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', memberUserId)
      .eq('phase', 'session')
      .gte('completed_at', sinceIso)
      .order('completed_at', { ascending: true }),
  ]);

  if (admin && !selfView && ctx.supabaseOrgId) {
    try {
      await supabase.from('organization_analytics_views').insert({
        organization_id: ctx.supabaseOrgId,
        viewer_user_id: viewerUserId,
        subject_user_id: memberUserId,
      });
    } catch {
      /* optional audit table */
    }
  }

  const subjectLabel = memberLabel(members, memberUserId);

  const basePayload = buildPersonalAnalysisReportPayload({
    userName: subjectLabel,
    tasks: tasksRes.data || [],
    focusSessions: sessionsRes.data || [],
  });

  let insight = null;
  try {
    insight = await buildAnalyticsInsight({
      metrics: basePayload.metrics,
      userName: subjectLabel,
      userId: viewerUserId,
    });
  } catch (e) {
    console.warn('[member-report] insight skipped:', e?.message || e);
  }

  const payload = {
    ...basePayload,
    generatedAt: new Date().toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }),
    insight: insight
      ? {
          summary: insight.summary,
          tips: Array.isArray(insight.tips) ? insight.tips : [],
        }
      : null,
  };

  try {
    const pdfBuffer = await generateAnalyticsPdf(payload);
    const dateSlug = new Date().toISOString().slice(0, 10);
    const safeName = String(subjectLabel || 'member')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
      .slice(0, 40);
    const filename = `thryvloop-report-${safeName || 'member'}-${dateSlug}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[member-report]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate report PDF.' },
      { status: 500 }
    );
  }
}
