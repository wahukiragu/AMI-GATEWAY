import Link from 'next/link';
import { StageBars } from './StageBars';
import { acknowledgeAction } from '@/app/connections/actions';
import { VERIFICATION_LABEL } from '@/lib/framework';
import { waLink } from '@/lib/whatsapp';
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

function WhatsAppLink({ c }: { c: MyConnection }) {
  if (!c.other_phone) return null;
  const message = `Hi ${c.other_name}, this is regarding our connection at ${c.edition_name ?? 'the AMI Festival'}.`;
  return (
    <a href={waLink(c.other_phone, message)} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm gap-2 border-[#25D366]/40 text-[#128C4A]">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366" aria-hidden="true">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.42-1.34a9.86 9.86 0 0 0 4.62 1.16h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm5.77 14.11c-.24.68-1.4 1.31-1.93 1.36-.5.05-.99.24-3.33-.7-2.82-1.14-4.62-4.01-4.76-4.2-.14-.19-1.14-1.51-1.14-2.89s.72-2.05.98-2.33c.24-.26.53-.32.7-.32h.5c.16 0 .38-.03.58.44.24.57.81 1.99.88 2.13.07.14.11.31.02.5-.09.19-.14.31-.28.47-.14.16-.29.36-.42.48-.14.14-.29.29-.12.57.16.28.72 1.19 1.55 1.93 1.07.95 1.97 1.24 2.25 1.38.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.19-.28.37-.23.62-.14.26.09 1.63.77 1.9.91.28.14.46.21.53.33.07.12.07.68-.17 1.36Z" />
      </svg>
      Message on WhatsApp
    </a>
  );
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

      {c.role === 'logger' && c.other_phone ? <div className="mt-3"><WhatsAppLink c={c} /></div> : null}

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
