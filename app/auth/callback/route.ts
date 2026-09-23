import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeNext } from '@/lib/errors';

// Handles the redirect back from an OAuth provider (Google). Supabase sends a
// `code` here, which is exchanged for a session cookie. This is separate from
// /auth/confirm, which handles the email code/link flow instead.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'), '/connections');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.redirect(new URL('/login?error=oauth', request.url));
}
