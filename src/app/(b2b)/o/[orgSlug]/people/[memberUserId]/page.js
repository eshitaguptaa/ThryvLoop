import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { notFound, redirect } from 'next/navigation';
import { authModalUrl } from '@/lib/authRoutes';
import MemberPersonalAnalytics from '@/components/b2b/MemberPersonalAnalytics';
import MemberReportDownloadButton from '@/components/b2b/MemberReportDownloadButton';
import {
  getOrgMembers,
  getWorkspaceContext,
  isOrgAdmin,
} from '@/lib/org';
import { canAccessMemberPersonalReport, formatOrgRole } from '@/lib/orgRoles';
import { mapOrgMembersForTasks, memberLabel } from '@/lib/orgTasks';
import { createSupabaseAdmin } from '@/lib/supabaseAdmin';

export default async function MemberAnalyticsPage({ params }) {
  const { userId } = await auth();
  if (!userId) redirect(authModalUrl('signin'));

  const { orgSlug, memberUserId } = await params;
  const subjectUserId = decodeURIComponent(memberUserId);
  const ctx = await getWorkspaceContext(userId, orgSlug);
  if (!ctx) notFound();

  const admin = isOrgAdmin(ctx.membership);
  const clerkMembers = await getOrgMembers(ctx.clerkOrgId);
  const members = mapOrgMembersForTasks(clerkMembers);
  const subject = members.find((m) => m.userId === subjectUserId);
  if (!subject) notFound();

  const subjectMembership = clerkMembers.find(
    (m) => (m.publicUserData?.userId || m.publicUserData?.user_id) === subjectUserId
  );
  const subjectRole = subjectMembership?.role || 'org:member';

  const allowed = canAccessMemberPersonalReport({
    viewerIsAdmin: admin,
    viewerUserId: userId,
    subjectUserId,
    subjectRole,
    insightsPolicy: ctx.insightsPolicy,
  });

  // Own analytics always allowed for self even without full policy
  if (!allowed) {
    return (
      <div className="max-w-lg">
        <h1 className="text-xl font-bold text-foreground mb-2">Analytics restricted</h1>
        <p className="text-sm text-muted-foreground mb-4">
          {ctx.insightsPolicy !== 'full_individual'
            ? 'This workspace uses team analytics only. Admins cannot open full personal analytics for members.'
            : !admin
              ? 'Only workspace admins can open other members’ personal reports in full transparency mode.'
              : 'You cannot view this member’s personal analytics (admins cannot view other admins).'}
        </p>
        <Link
          href={`/o/${encodeURIComponent(ctx.slug)}/people`}
          className="text-sm font-semibold text-[#5D3FD3] hover:underline"
        >
          ← Back to People
        </Link>
      </div>
    );
  }

  const selfView = subjectUserId === userId;

  const supabase = createSupabaseAdmin();
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceIso = since.toISOString();

  const [tasksRes, sessionsRes, orgTasksRes] = await Promise.all([
    supabase.from('tasks').select('*').eq('user_id', subjectUserId).limit(500),
    supabase
      .from('focus_sessions')
      .select('*')
      .eq('user_id', subjectUserId)
      .gte('completed_at', sinceIso)
      .order('completed_at', { ascending: true }),
    ctx.supabaseOrgId
      ? supabase
          .from('organization_tasks')
          .select('*')
          .eq('organization_id', ctx.supabaseOrgId)
          .eq('assignee_user_id', subjectUserId)
          .or(`column_key.neq.done,completed_at.gte.${sinceIso}`)
      : Promise.resolve({ data: [] }),
  ]);

  // Access log for admin views of other people
  if (admin && !selfView && ctx.supabaseOrgId) {
    try {
      await supabase.from('organization_analytics_views').insert({
        organization_id: ctx.supabaseOrgId,
        viewer_user_id: userId,
        subject_user_id: subjectUserId,
      });
    } catch {
      /* optional table until migration is applied */
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/o/${encodeURIComponent(ctx.slug)}/people`}
            className="text-sm font-medium text-[#5D3FD3] hover:underline"
          >
            ← People
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-2">
            {memberLabel(members, subjectUserId)}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {formatOrgRole(subjectRole)}
            {admin && !selfView
              ? ' · Viewed under full individual transparency'
              : ' · Your personal metrics'}
          </p>
        </div>
        <MemberReportDownloadButton
          orgSlug={ctx.slug}
          memberUserId={subjectUserId}
          label="Download report"
        />
      </div>
      <MemberPersonalAnalytics
        tasks={tasksRes.data || []}
        focusSessions={sessionsRes.data || []}
        orgTasks={orgTasksRes.data || []}
        subjectLabel={memberLabel(members, subjectUserId)}
        orgSlug={ctx.slug}
        memberUserId={subjectUserId}
        showDownload={false}
      />
    </div>
  );
}
