import type { Metadata } from 'next';
import { NewConnectionForm } from './NewConnectionForm';
import { Flash } from '@/components/Flash';
import { requireRegistered } from '@/lib/auth';
import { getFramework } from '@/lib/framework-data';
import { COUNTRIES, CURRENCIES } from '@/lib/framework';

export const metadata: Metadata = { title: 'Stage 2: Log a connection' };

export default async function NewConnectionPage({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const sp = await searchParams;
  await requireRegistered();
  const framework = await getFramework();
  const sdgs = framework.sdgs.filter((s) => s.featured);

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-maroon">Stage 2 of 2</p>
      <h1 className="mt-1 text-3xl">Log a connection</h1>
      <div className="mb-8 mt-3 max-w-2xl space-y-2 text-lg">
        <p>A connection is a moment where you and someone else could create real value together: a booking, a sale, a collaboration, or simply a promise to stay in touch.</p>
        <p className="text-base text-navy-500">Logging it makes sure the festival leads to meaningful connections that can be followed up and tracked, not just good conversations. Come back any time to move it to the next stage.</p>
      </div>
      <Flash notice={sp.notice} />
      <NewConnectionForm stages={framework.stages} sdgs={sdgs} currencies={CURRENCIES} countries={COUNTRIES} />
    </main>
  );
}
