import type { Metadata } from 'next';
import { Flash } from '@/components/Flash';
import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatEditionDates, editionStatus } from '@/lib/dates';
import type { Edition } from '@/lib/types';
import { createEditionAction, setCurrentEditionAction } from './actions';

export const metadata: Metadata = { title: 'Admin: editions' };

export default async function AdminEditions({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const { role } = await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase.from('editions').select('*').order('starts_on', { ascending: false, nullsFirst: false });
  const editions = (data ?? []) as Edition[];

  return (
    <div>
      <h1 className="text-3xl">Editions</h1>
      <p className="mb-6 mt-2 max-w-2xl text-navy-500">
        One AMI Gateway, many events. Every registration and connection belongs to whichever edition is marked <strong>current</strong> at the
        time. Queue a future edition (a new venue, a new year — Kabarak, say) ahead of time without disrupting the one running now, then switch
        over when it starts.
      </p>
      <Flash notice={sp.notice} error={sp.error} />

      <ul className="mb-10 space-y-3">
        {editions.map((e) => {
          const status = editionStatus(e.starts_on, e.ends_on);
          return (
            <li key={e.id} className="card flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-lg font-bold">
                  {e.name} {e.is_current ? <span className="tag tag-gold ml-1">Current</span> : null}
                </p>
                <p className="text-sm text-navy-500">
                  {e.venue ?? 'No venue set'} · {formatEditionDates(e.starts_on, e.ends_on) || 'No dates set'}
                  {status.phase !== 'unknown' ? ` · ${status.label}` : ''}
                </p>
              </div>
              {!e.is_current && role === 'admin' ? (
                <form action={setCurrentEditionAction}>
                  <input type="hidden" name="id" value={e.id} />
                  <button type="submit" className="btn btn-primary btn-sm">Make current</button>
                </form>
              ) : null}
            </li>
          );
        })}
        {!editions.length ? <p className="text-navy-500">No editions yet.</p> : null}
      </ul>

      {role === 'admin' ? (
        <section className="card max-w-xl">
          <h2 className="text-xl">Add a new edition</h2>
          <form action={createEditionAction} className="mt-4">
            <div className="mb-4">
              <label htmlFor="name" className="label">Name</label>
              <input id="name" name="name" required className="input" placeholder="AMI Kabarak Festival 2027" />
            </div>
            <div className="mb-4">
              <label htmlFor="venue" className="label">Venue</label>
              <input id="venue" name="venue" className="input" placeholder="Kabarak University" />
            </div>
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="starts_on" className="label">Start date</label>
                <input id="starts_on" name="starts_on" type="date" required className="input" />
              </div>
              <div>
                <label htmlFor="ends_on" className="label">End date <span className="hint font-normal">Optional, for one-day events</span></label>
                <input id="ends_on" name="ends_on" type="date" className="input" />
              </div>
            </div>
            <label className="mb-4 flex items-start gap-3">
              <input type="checkbox" name="make_current" className="mt-1 h-5 w-5 accent-navy" />
              <span>Make this the current edition immediately. Leave unticked to queue it for later.</span>
            </label>
            <button type="submit" className="btn btn-primary">Add edition</button>
          </form>
        </section>
      ) : null}
    </div>
  );
}
