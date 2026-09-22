'use client';

import { useState, useTransition } from 'react';
import { saveConsent } from './actions';

export function GateForm() {
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError('');
        start(async () => {
          const res = await saveConsent(fd);
          if (res?.error) setError(res.error);
        });
      }}
    >
      <fieldset className="space-y-4">
        <legend className="mb-2 text-lg font-bold">Required</legend>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="agreed" className="mt-1 h-5 w-5 accent-navy" />
          <span>I have read the privacy notice and I agree that AMI may collect and use my information as described. I understand other participants can find my name, country and type of work.</span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="adult" className="mt-1 h-5 w-5 accent-navy" />
          <span>I am 18 or older. If I am younger, a parent or guardian is completing this with me.</span>
        </label>
      </fieldset>
      <fieldset className="mt-6 space-y-4">
        <legend className="mb-2 text-lg font-bold">Optional. You can change these later</legend>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="public_name" className="mt-1 h-5 w-5 accent-navy" />
          <span>AMI may name me or my group when sharing festival results and stories.</span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" name="future_contact" className="mt-1 h-5 w-5 accent-navy" />
          <span>AMI may contact me about future editions of the festival.</span>
        </label>
      </fieldset>
      {error ? <p className="err mt-4" role="alert">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn btn-primary mt-6">{pending ? 'Saving…' : 'Agree and continue'}</button>
    </form>
  );
}
