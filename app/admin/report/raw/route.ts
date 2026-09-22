import { NextResponse } from 'next/server';
import { getStaffRole } from '@/lib/auth';
import { buildReportHtml } from '@/lib/report';
import { loadReportInput } from '@/lib/report-data';

// The standalone report as a web page. Add ?print=1 to open the print dialog (save as PDF).
export async function GET(request: Request) {
  if (!(await getStaffRole())) return new NextResponse('Not found', { status: 404 });
  const url = new URL(request.url);
  const input = await loadReportInput(url.searchParams.get('edition') ?? undefined, url.searchParams.get('print') === '1');
  return new NextResponse(buildReportHtml(input), {
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store' },
  });
}
