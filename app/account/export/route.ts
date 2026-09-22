import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMyParticipant, getUser } from '@/lib/auth';
import { site } from '@/lib/config';

// A copy of everything the participant can see about themselves (their right of access).
export async function GET() {
  const user = await getUser();
  const participant = await getMyParticipant();
  if (!user || !participant) return NextResponse.redirect(new URL('/login', site.siteUrl));

  const supabase = await createClient();
  const { data: connections } = await supabase.rpc('my_connections');
  const ids = ((connections ?? []) as { id: string }[]).map((c) => c.id);
  const { data: updates } = ids.length ? await supabase.from('connection_updates').select('*').in('connection_id', ids) : { data: [] };

  const body = JSON.stringify(
    { exported_at: new Date().toISOString(), participant, connections, history: updates },
    null,
    2,
  );
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': 'attachment; filename="my-ami-data.json"',
      'Cache-Control': 'private, no-store',
    },
  });
}
