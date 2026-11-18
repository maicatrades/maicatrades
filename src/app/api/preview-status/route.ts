import { NextResponse } from 'next/server';
import { isReadOnlyPreview, PREVIEW_GUARD_VERSION } from '@/lib/read-only-preview';
export const dynamic = 'force-dynamic';
export async function GET() {
  return NextResponse.json({readOnlyPreview: isReadOnlyPreview(), guardVersion: PREVIEW_GUARD_VERSION},
    {headers: {'Cache-Control': 'no-store, max-age=0'}});
}
