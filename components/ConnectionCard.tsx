import Link from 'next/link';
import { StageBars } from './StageBars';
import { acknowledgeAction } from '@/app/connections/actions';
import { VERIFICATION_LABEL } from '@/lib/framework';
import type { FrameworkStage, MyConnection } from '@/lib/types';

function money(c: MyConnection) {
  if (c.value_amount === null || !c.value_currency) return null;
  const amount = Number(c.value_amount).toLocaleString('en-US', { maximumFractionDigits: 2 });
  return `${c.value_currency} ${amount} (${c.payment_status === 'paid' ? 'paid' : 'agreed, not yet paid'})`;
}

export function ackTag(c: MyConnection) {
  if (c.role === 'counterparty') {
    return c.ack_status === 'pending' ? <span className="tag tag-gold">Waiting for you</span> : <span className="tag tag-soft">You marked it {c.ack_status}</span>;
  }
  if (c.ack_status === 'confirmed') return <span className="tag tag-navy">Confirmed by {c.other_name}</span>;
  if (c.ack_status === 'disputed') return <span className="tag tag-maroon">Not quite right</span>;
  return <span className="tag tag-soft">Waiting for {c.other_name} to confirm</span>;
}

export function ConnectionCard({ c, stages }: { c: MyConnection; stages: FrameworkStage[] }) {
  const stage = stages.find((s) => s.stage_no === c.stage_no);
  const amount = money(c);
  const waiting = c.role === 'counterparty' && c.ack_status === 'pending';

  return (
    <li className="card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg">
            {c.other_name}{c.other_country ? <span className="font-normal text-navy-500">, {c.other_country}</span> : null}
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <StageBars stage={c.stage_no} label={`Stage ${c.stage_no}: ${stage?.name ?? ''}`} />
            <span className="font-semibold">{stage?.name}</span>
            <span className="text-navy-500">· {c.event_type}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ackTag(c)}
          {c.verification === 'ami_verified' ? <span className="tag tag-gold">{VERIFICATION_LABEL.ami_verified}</span> : null}
        </div>
      </div>
      <p className="mt-3">{c.summary}</p>
      {amount ? <p className="mt-1 text-sm font-semibold">{amount}</p> : null}
      {c.role === 'logger' && c.ack_status === 'disputed' && c.ack_note ? <p className="mt-2 rounded-lg bg-maroon-100 p-2 text-sm text-maroon">They said: {c.ack_note}</p> : null}
      {c.role === 'logger' && c.next_step ? (
        <p className="mt-2 text-sm text-navy-500">Next step: {c.next_step}{c.remind_on ? ` · remind me ${c.remind_on}` : ''}</p>
      ) : null}
      {c.role === 'counterparty' ? <p className="mt-2 text-sm text-navy-500">Logged by {c.other_name}.</p> : null}

      {waiting ? (
        <form action={acknowledgeAction} className="mt-4 rounded-xl bg-sand p-4">
          <input type="hidden" name="id" value={c.id} />
          <label htmlFor={`note-${c.id}`} className="label">Is this right? <span className="hint font-normal">Add a note if not</span></label>
          <input id={`note-${c.id}`} name="note" className="input mb-3" maxLength={500} />
          <div className="flex flex-wrap gap-2">
            <button type="submit" name="decision" value="confirmed" className="btn btn-primary btn-sm">Yes, confirm</button>
            <button type="submit" name="decision" value="disputed" className="btn btn-ghost btn-sm">Not quite right</button>
          </div>
        </form>
      ) : null}

      <p className="mt-4">
        <Link href={`/connections/${c.id}`} className="font-semibold underline">{c.role === 'logger' ? 'Update or view history' : 'View details'}</Link>
      </p>
    </li>
  );
}
