import { NextResponse } from 'next/server';

/**
 * Legacy endpoint — accountability / member activity monitoring was removed.
 * Always returns disabled so stale clients do not 404.
 */
export async function GET() {
  return NextResponse.json({ enabled: false });
}
