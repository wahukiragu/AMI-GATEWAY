'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { createConnectionAction } from './actions';
import { StagePicker } from '@/components/StagePicker';
import { createClient } from '@/lib/supabase/client';
import { typeLabel, PAYMENT_OPTIONS } from '@/lib/framework';
import type { FrameworkStage, Sdg } from '@/lib/types';

interface Person {
  id: string;
  display_name: string;
  organisation: string | null;
  participant_type: string | null;
  country: string | null;
  status: string;
}

interface Props {
  stages: FrameworkStage[];
  sdgs: Sdg[];
  currencies: string[];
  countries: string[];
}

const statusTag = (s: string) =>
  s === 'registered' ? <span className="tag tag-navy">Registered</span> : <span className="tag tag-soft">Not yet registered</span>;

export function NewConnectionForm({ stages, sdgs, currencies, countries }: Props) {
  const [mode, setMode] = useState<'search' | 'new'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [searched, setSearched] = useState(false);
  const [chosen, setChosen] = useState<Person | null>(null);
  const [stage, setStage] = useState(2);
  const [eventType, setEventType] = useState(stages.find((s) => s.stage_no === 2)?.event_types[0] ?? '');
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const stageDef = stages.find((s) => s.stage_no === stage) ?? stages[0];

  useEffect(() => {
    if (mode !== 'search' || chosen) return;
    const t = setTimeout(async () => {
      supabaseRef.current ??= createClient();
      const { data } = await supabaseRef.current.rpc('search_participants', { p_query: query });
      setResults((data ?? []) as Person[]);
      setSearched(true);
    }, 250);
    return () => clearTimeout(t);
  }, [query, mode, chosen]);

  function pickStage(n: number) {
    setStage(n);
    setEventType(stages.find((s) => s.stage_no === n)?.event_types[0] ?? '');
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (mode === 'search' && !chosen) {
          setError('Choose who you connected with, or add them as someone new.');
          return;
        }
        setError('');
        start(async () => {
          const res = await createConnectionAction(fd);
          if (res?.error) setError(res.error);
        });
      }}
    >
      <input type="hidden" name="mode" value={mode === 'new' ? 'new' : 'existing'} />
      <input type="hidden" name="with_id" value={chosen?.id ?? ''} />

      {/* 1. Who */}
      <section className="card mb-6">
        <h2 className="mb-1 text-xl">1. Who did you connect with?</h2>
        {chosen ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sand p-3">
            <span>
              <strong>{chosen.display_name}</strong>{chosen.country ? `, ${chosen.country}` : ''} {statusTag(chosen.status)}
              {chosen.participant_type ? <span className="block text-sm text-navy-500">{typeLabel(chosen.participant_type)}</span> : null}
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setChosen(null)}>Change</button>
          </div>
        ) : mode === 'search' ? (
          <div className="mt-3">
            <label htmlFor="who" className="label">Search by name</label>
            <input id="who" className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Start typing a name" autoComplete="off" />
            <ul className="mt-3 space-y-2" aria-live="polite">
              {results.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => setChosen(p)} className="flex w-full items-center justify-between gap-3 rounded-xl border-2 border-navy/15 p-3 text-left hover:border-navy">
                    <span>
                      <strong>{p.display_name}</strong>{p.country ? `, ${p.country}` : ''}
                      {p.participant_type ? <span className="block text-sm text-navy-500">{typeLabel(p.participant_type)}</span> : null}
                    </span>
                    {statusTag(p.status)}
                  </button>
                </li>
              ))}
              {searched && results.length === 0 ? <li className="text-sm text-navy-500">No match yet.</li> : null}
            </ul>
            <button type="button" className="btn btn-ghost mt-4" onClick={() => setMode('new')}>Add someone who is not on the list</button>
          </div>
        ) : (
          <div className="mt-3">
            <p className="hint mb-4">We will keep this connection with their profile. When they register, they will see it and can confirm it. Only add contact details if they are happy to be contacted.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="new_name" className="label">Their name</label>
                <input id="new_name" name="new_name" className="input" defaultValue={query} />
              </div>
              <div>
                <label htmlFor="new_country" className="label">Their country</label>
                <select id="new_country" name="new_country" className="input" defaultValue="">
                  <option value="">Not sure</option>
                  {countries.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="new_offering" className="label">What do they do? <span className="hint font-normal">Optional</span></label>
                <input id="new_offering" name="new_offering" className="input" maxLength={300} />
              </div>
              <div>
                <label htmlFor="new_email" className="label">Their email <span className="hint font-normal">Optional</span></label>
                <input id="new_email" name="new_email" type="email" className="input" />
              </div>
              <div>
                <label htmlFor="new_phone" className="label">Their phone <span className="hint font-normal">Optional</span></label>
                <input id="new_phone" name="new_phone" type="tel" className="input" />
              </div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm mt-4" onClick={() => setMode('search')}>Search the list instead</button>
          </div>
        )}
      </section>

      {/* 2. Stage */}
      <section className="card mb-6">
        <h2 className="mb-1 text-xl">2. How far did it get?</h2>
        <p className="hint mb-4">Pick the stage that fits today. You can move it forward later.</p>
        <StagePicker stages={stages} value={stage} onChange={pickStage} />
        <div className="mt-5">
          <label htmlFor="event_type" className="label">What kind of moment was it?</label>
          <select id="event_type" name="event_type" className="input" value={eventType} onChange={(e) => setEventType(e.target.value)}>
            {stageDef.event_types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="mt-5">
          <label htmlFor="summary" className="label">What happened? <span className="hint font-normal">A few words</span></label>
          <input id="summary" name="summary" className="input" maxLength={500} placeholder="For example: asked to book our group for a heritage evening" />
        </div>
      </section>

      {/* 3. Value */}
      <section className="card mb-6">
        <h2 className="mb-1 text-xl">3. Did any sale or payment happen?</h2>
        <p className="hint mb-4">Only if money changed hands or was agreed: a sale, booking fee, deposit or commission. Leave empty if not.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="value" className="label">Amount</label>
            <input id="value" name="value" type="number" min="0" step="any" inputMode="decimal" className="input" />
          </div>
          <div>
            <label htmlFor="currency" className="label">Currency</label>
            <select id="currency" name="currency" className="input" defaultValue="ZAR">
              {currencies.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="payment" className="label">Status</label>
            <select id="payment" name="payment" className="input" defaultValue="paid">
              {PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* 4. Impact */}
      <section className="card mb-6">
        <h2 className="mb-1 text-xl">4. What did this help with? <span className="hint font-normal">Optional</span></h2>
        <p className="hint mb-4">AMI uses these to show funders how the festival contributes to the Sustainable Development Goals. Choose up to six.</p>
        <div className="flex flex-wrap gap-2">
          {sdgs.map((g) => (
            <label key={g.no} className="cursor-pointer">
              <input type="checkbox" name="sdg" value={g.no} className="peer sr-only" />
              <span className="inline-block rounded-full border-2 border-navy/25 px-3 py-1.5 text-sm peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2">
                Goal {g.no}: {g.name}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* 5. Private notes */}
      <section className="card mb-6">
        <h2 className="mb-1 text-xl">5. For your own notes</h2>
        <p className="hint mb-4">Private. Never shown to the other person. We can email these to you as a reminder.</p>
        <div className="mb-4">
          <label htmlFor="reflection" className="label">What difference could this make to you or your work?</label>
          <textarea id="reflection" name="reflection" rows={3} maxLength={1000} className="input" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="next_step" className="label">Your next step</label>
            <input id="next_step" name="next_step" maxLength={300} className="input" />
          </div>
          <div>
            <label htmlFor="remind_on" className="label">Remind me on</label>
            <input id="remind_on" name="remind_on" type="date" className="input" />
          </div>
        </div>
      </section>

      {error ? <p className="err mb-4" role="alert">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn btn-gold">{pending ? 'Saving…' : 'Save connection'}</button>
    </form>
  );
}
