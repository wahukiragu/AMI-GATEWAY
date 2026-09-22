'use client';

import { useState, useTransition } from 'react';
import { registerAction } from './actions';
import { COUNTRIES, PARTICIPANT_TYPES, WANTS } from '@/lib/framework';
import type { Participant } from '@/lib/types';

export function RegisterForm({ participant, email }: { participant: Participant; email: string }) {
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  const isNew = participant.status !== 'registered';
  const guessed = participant.display_name === email.split('@')[0] ? '' : participant.display_name;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError('');
        start(async () => {
          const res = await registerAction(fd);
          if (res?.error) setError(res.error);
        });
      }}
    >
      <div className="mb-5">
        <label htmlFor="name" className="label">Your name, or the name of your group</label>
        <input id="name" name="name" className="input" defaultValue={guessed} autoComplete="name" />
      </div>
      <div className="mb-5">
        <label htmlFor="org" className="label">Organisation <span className="hint font-normal">Optional</span></label>
        <input id="org" name="org" className="input" defaultValue={participant.organisation ?? ''} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="mb-5">
          <label htmlFor="type" className="label">What best describes you?</label>
          <select id="type" name="type" className="input" defaultValue={participant.participant_type ?? ''}>
            <option value="" disabled>Choose one</option>
            {PARTICIPANT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="mb-5">
          <label htmlFor="country" className="label">Country</label>
          <select id="country" name="country" className="input" defaultValue={participant.country ?? ''}>
            <option value="" disabled>Choose a country</option>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="mb-5">
        <label htmlFor="offering" className="label">What are you bringing? <span className="hint font-normal">Music, craft, knowledge, goods</span></label>
        <input id="offering" name="offering" className="input" defaultValue={participant.offering ?? ''} maxLength={300} />
      </div>
      <fieldset className="mb-5">
        <legend className="label">What are you hoping for?</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {WANTS.map((w) => (
            <label key={w} className="flex items-center gap-2">
              <input type="checkbox" name="wants" value={w} defaultChecked={participant.wants?.includes(w)} className="h-5 w-5 accent-navy" />
              {w}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="mb-5">
          <label htmlFor="email" className="label">Email <span className="hint font-normal">Used to sign in</span></label>
          <input id="email" className="input bg-sand" value={email} readOnly aria-readonly="true" />
        </div>
        <div className="mb-5">
          <label htmlFor="phone" className="label">Phone <span className="hint font-normal">Optional</span></label>
          <input id="phone" name="phone" type="tel" inputMode="tel" className="input" defaultValue={participant.phone ?? ''} autoComplete="tel" />
        </div>
      </div>
      {error ? <p className="err mb-4" role="alert">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn btn-primary">{pending ? 'Saving…' : isNew ? 'Register' : 'Save changes'}</button>
    </form>
  );
}
