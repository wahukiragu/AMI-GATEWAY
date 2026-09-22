import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from './LoginForm';
import { getUser } from '@/lib/auth';
import { safeNext } from '@/lib/errors';
import { Flash } from '@/components/Flash';

export const metadata: Metadata = { title: 'Log in' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next, '/connections');
  let user = null;
  try {
    user = await getUser();
  } catch {
    /* Supabase not configured */
  }
  if (user) redirect(next);

  return (
    <main className="mx-auto max-w-md px-5 py-14">
      <h1 className="text-3xl">Log in or get started</h1>
      <p className="mb-6 mt-2 text-navy-500">No password needed. We email you a short code.</p>
      <Flash error={sp.error === 'link' ? 'That sign-in link has expired. Please ask for a new code.' : undefined} />
      <div className="card">
        <LoginForm next={next} />
      </div>
    </main>
  );
}
