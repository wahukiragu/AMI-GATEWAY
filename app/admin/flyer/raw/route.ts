import { NextResponse } from 'next/server';
import { getStaffRole } from '@/lib/auth';
import { buildFlyerHtml } from '@/lib/flyer';
import { createClient } from '@/lib/supabase/server';
import { site } from '@/lib/config';
import type { Edition } from '@/lib/types';

// The printable flyer as a standalone page. Add ?print=1 to open the print dialog.
export async function GET(request: Request) {
  if (!(await getStaffRole())) return new NextResponse('Not found', { status: 404 });
  const supabase = await createClient();
  const { data } = await supabase.from('editions').select('*').eq('is_current', true).maybeSingle();
  const html = await buildFlyerHtml({
    orgName: site.org,
    edition: (data as Edition | null) ?? null,
    siteUrl: site.siteUrl,
    frameworkName: site.frameworkName,
    autoPrint: new URL(request.url).searchParams.get('print') === '1',
  });
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'private, no-store' } });
}
