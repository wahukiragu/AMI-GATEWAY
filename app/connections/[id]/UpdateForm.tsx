'use client';

import { useState, useTransition } from 'react';
import { updateConnectionAction } from './actions';
import { StagePicker } from '@/components/StagePicker';
import { PAYMENT_OPTIONS } from '@/lib/framework';
import type { FrameworkStage, MyConnection } from '@/lib/types';

export function UpdateForm({ c, stages, currencies }: { c: MyConnection; stages: FrameworkStage[]; currencies: string[] }) {
  const [stage, setStage] = useState(c.stage_no);
  const stageDef = stages.find((s) => s.stage_no === stage) ?? stages[0];
  const [eventType, setEventType] = useState(
    stageDef.event_types.includes(c.event_type) ? c.event_type : stageDef.event_types[0],
  );
  const [error, setError] = useState('');
  const [pending, start] = useTransition();

  function pickStage(n: number) {
    setStage(n);
    const def = stages.find((s) => s.stage_no === n) ?? stages[0];
    setEventType(def.event_types.includes(eventType) ? eventType : def.event_types[0]);
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError('');
        start(async () => {
          const res = await updateConnectionAction(fd);
          if (res?.error) setError(res.error);
        });
      }}
    >
      <input type="hidden" name="id" value={c.id} />
      <h2 className="mb-1 text-xl">Update this connection</h2>
      <p className="hint mb-4">Moving it forward, or changing the amount, asks the other person to confirm again.</p>
      <StagePicker stages={stages} value={stage} onChange={pickStage} min={c.stage_no} />

      <div className="mt-5">
        <label htmlFor="event_type" className="label">What kind of moment was it?</label>
        <select id="event_type" name="event_type" className="input" value={eventType} onChange={(e) => setEventType(e.target.value)}>
          {stageDef.event_types.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="mt-5">
        <label htmlFor="note" className="label">What changed? <span className="hint font-normal">Shown in the history</span></label>
        <input id="note" name="note" className="input" maxLength={500} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="value" className="label">Total amount so far</label>
          <input id="value" name="value" type="number" min="0" step="any" inputMode="decimal" className="input" defaultValue={c.value_amount ?? ''} />
        </div>
        <div>
          <label htmlFor="currency" className="label">Currency</label>
          <select id="currency" name="currency" className="input" defaultValue={c.value_currency ?? 'ZAR'}>
            {currencies.map((cur) => <option key={cur}>{cur}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="payment" className="label">Status</label>
          <select id="payment" name="payment" className="input" defaultValue={c.payment_status === 'agreed' ? 'agreed' : 'paid'}>
            {PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-sand p-4">
        <p className="mb-3 text-sm font-semibold">For your own notes (private)</p>
        <label htmlFor="reflection" className="label">What difference did this make?</label>
        <textarea id="reflection" name="reflection" rows={3} maxLength={1000} className="input mb-3" defaultValue={c.reflection ?? ''} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="next_step" className="label">Next step</label>
            <input id="next_step" name="next_step" maxLength={300} className="input" defaultValue={c.next_step ?? ''} />
          </div>
          <div>
            <label htmlFor="remind_on" className="label">Remind me on</label>
            <input id="remind_on" name="remind_on" type="date" className="input" defaultValue={c.remind_on ?? ''} />
          </div>
        </div>
      </div>

      {error ? <p className="err mt-4" role="alert">{error}</p> : null}
      <button type="submit" disabled={pending} className="btn btn-primary mt-6">{pending ? 'Saving…' : 'Save update'}</button>
    </form>
  );
}
