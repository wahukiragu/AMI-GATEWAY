import type { Metadata } from 'next';
import Link from 'next/link';
import { ConnectionCard } from '@/components/ConnectionCard';
import { ClaimSuggestions } from '@/components/ClaimSuggestions';
import { Flash } from '@/components/Flash';
import { requireRegistered } from '@/lib/auth';
import { getFramework } from '@/lib/framework-data';
import { createClient } from '@/lib/supabase/server';
import type { MyConnection } from '@/lib/types';
import { emailSummaryAction } from './actions';

export const metadata: Metadata = { title: 'My connections' };

export default async function ConnectionsPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const { participant } = await requireRegistered();
  const framework = await getFramework();
  const supabase = await createClient();
  const { data } = await supabase.rpc('my_connections');
  const rows = (data ?? []) as MyConnection[];
  const waiting = rows.filter((r) => r.role === 'counterparty' && r.ack_status === 'pending');
  const rest = rows.filter((r) => !waiting.includes(r));

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl">My connections</h1>
      <p className="mt-2 text-navy-500">Signed in as {participant.display_name}.</p>

      <div className="mb-8 mt-6 flex flex-wrap gap-3">
        <Link href="/connections/new" className="btn btn-gold">Log a connection</Link>
        <form action={emailSummaryAction}>
          <button type="submit" className="btn btn-ghost">Email me my summary</button>
        </form>
        <a href="/connections/summary" className="btn btn-ghost">Save summary</a>
      </div>

      <Flash notice={sp.notice} error={sp.error} />
      <ClaimSuggestions returnTo="connections" />

      {waiting.length ? (
        <section className="mb-10" aria-labelledby="waiting-h">
          <h2 id="waiting-h" className="mb-1 text-xl">Waiting for you to confirm ({waiting.length})</h2>
          <p className="mb-4 text-sm text-navy-500">Someone logged a connection with you. Confirming makes it count as verified evidence.</p>
          <ul className="space-y-4">{waiting.map((c) => <ConnectionCard key={c.id} c={c} stages={framework.stages} />)}</ul>
        </section>
      ) : null}

      <section aria-labelledby="all-h">
        <h2 id="all-h" className="mb-4 text-xl">All connections ({rest.length})</h2>
        {rest.length ? (
          <ul className="space-y-4">{rest.map((c) => <ConnectionCard key={c.id} c={c} stages={framework.stages} />)}</ul>
        ) : (
          <div className="card text-center">
            <p className="mb-4">You have not logged a connection yet.</p>
            <Link href="/connections/new" className="btn btn-primary">Log your first connection</Link>
          </div>
        )}
      </section>

      <p className="mt-10 text-sm text-navy-500">
        <Link href="/account" className="underline">Account and your data</Link>
      </p>
    </main>
  );
}
