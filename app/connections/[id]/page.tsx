import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { UpdateForm } from './UpdateForm';
import { ConnectionCard } from '@/components/ConnectionCard';
import { Flash } from '@/components/Flash';
import { requireRegistered } from '@/lib/auth';
import { getFramework } from '@/lib/framework-data';
import { CURRENCIES } from '@/lib/framework';
import { createClient } from '@/lib/supabase/server';
import type { ConnectionUpdate, MyConnection } from '@/lib/types';

export const metadata: Metadata = { title: 'Connection' };

export default async function ConnectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  await requireRegistered();
  const framework = await getFramework();
  const supabase = await createClient();

  const { data } = await supabase.rpc('my_connections');
  const c = ((data ?? []) as MyConnection[]).find((r) => r.id === id);
  if (!c) notFound();

  const { data: history } = await supabase.from('connection_updates').select('*').eq('connection_id', id).order('created_at', { ascending: false });
  const updates = (history ?? []) as ConnectionUpdate[];

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="mb-4"><Link href="/connections" className="font-semibold underline">Back to my connections</Link></p>
      <Flash notice={sp.notice} />
      <ul className="mb-10"><ConnectionCard c={c} stages={framework.stages} /></ul>

      {c.role === 'logger' ? (
        <section className="card mb-10">
          <UpdateForm c={c} stages={framework.stages} currencies={CURRENCIES} />
        </section>
      ) : null}

      <section aria-labelledby="hist-h">
        <h2 id="hist-h" className="mb-3 text-xl">History</h2>
        <ol className="space-y-3">
          {updates.map((u) => (
            <li key={u.id} className="rounded-xl bg-sand p-3 text-sm">
              <span className="font-semibold">{framework.stages.find((s) => s.stage_no === u.stage_no)?.name}</span>
              {' · '}{new Date(u.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
              {u.note ? <span className="block text-navy-500">{u.note}</span> : null}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
