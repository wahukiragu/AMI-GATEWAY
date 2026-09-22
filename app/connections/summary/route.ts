import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMyParticipant, getUser } from '@/lib/auth';
import { site } from '@/lib/config';
import { buildSummary } from '@/lib/summary';
import type { MyConnection } from '@/lib/types';

// Downloadable text copy of the participant's own summary (works without email being configured).
export async function GET() {
  const user = await getUser();
  const participant = await getMyParticipant();
  if (!user || !participant) return NextResponse.redirect(new URL('/login', site.siteUrl));
  const supabase = await createClient();
  const { data } = await supabase.rpc('my_connections');
  const summary = buildSummary(participant.display_name, (data ?? []) as MyConnection[], `${site.siteUrl}/connections`);
  return new NextResponse(summary.text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': 'attachment; filename="my-ami-connections.txt"',
      'Cache-Control': 'private, no-store',
    },
  });
}
