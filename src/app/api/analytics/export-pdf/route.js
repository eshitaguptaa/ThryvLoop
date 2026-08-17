import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { getWorkspaceUserId } from '@/lib/workspace/requireAuth';
import { generateAnalyticsPdf } from '@/lib/analysis/generatePdf';
import { validateReportPayload } from '@/lib/analysis/validateReportPayload';
import { buildPersonalAnalyticsFilename } from '@/lib/analysis/reportFilename';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const userId = await getWorkspaceUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const validated = validateReportPayload(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const user = await currentUser();
  const displayName =
    validated.payload.userName ||
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') ||
    user?.fullName ||
    user?.username ||
    user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ||
    'User';

  const payload = { ...validated.payload, userName: displayName };

  try {
    const pdfBuffer = await generateAnalyticsPdf(payload);
    const filename = buildPersonalAnalyticsFilename(
      displayName,
      payload.metrics?.date || payload.reportDateKey || new Date()
    );

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[export-pdf]', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to generate PDF. Try again in a moment.' },
      { status: 500 }
    );
  }
}
