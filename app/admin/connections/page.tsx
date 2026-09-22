import type { Metadata } from 'next';
import { EditionSelect } from '@/components/EditionSelect';
import { Flash } from '@/components/Flash';
import { StageBars } from '@/components/StageBars';
import { requireStaff } from '@/lib/auth';
import { loadAdminData } from '@/lib/admin-data';
import { getFramework } from '@/lib/framework-data';
import { VERIFICATION_LABEL } from '@/lib/framework';
import { verificationOf } from '@/lib/metrics';
import { verifyConnectionAction } from '../actions';

export const metadata: Metadata = { title: 'Admin: connections' };

export default async function AdminConnections({ searchParams }: { searchParams: Promise<{ edition?: string; notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const { role } = await requireStaff();
  const [{ editions, edition, connections }, framework] = await Promise.all([loadAdminData(sp.edition), getFramework()]);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Connections ({connections.length})</h1>
          <p className="text-sm text-maroon">Contains personal data. Private notes are never visible here.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <EditionSelect editions={editions} current={edition?.id} />
          <a href="/admin/export/connections" className="btn btn-primary btn-sm">Save internal list (.csv)</a>
        </div>
      </div>
      <Flash notice={sp.notice} error={sp.error} />
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-navy"><th className="py-2 pr-3">Logged by</th><th className="pr-3">With</th><th className="pr-3">Stage</th><th className="pr-3">What happened</th><th className="pr-3">Value</th><th className="pr-3">Evidence</th><th></th></tr>
          </thead>
          <tbody>
            {connections.map((c) => {
              const v = verificationOf(c);
              return (
                <tr key={c.id} className="border-b border-navy/10 align-top">
                  <td className="py-2 pr-3"><strong>{c.logger?.display_name}</strong><span className="block text-xs text-navy-500">{c.logger?.country}</span></td>
                  <td className="pr-3"><strong>{c.other?.display_name ?? 'Removed participant'}</strong><span className="block text-xs text-navy-500">{c.other?.country}{c.other?.status === 'unverified' ? ' · unverified' : ''}</span></td>
                  <td className="pr-3"><StageBars stage={c.stage_no} /><span className="block text-xs">{framework.stages.find((s) => s.stage_no === c.stage_no)?.name}</span></td>
                  <td className="pr-3">{c.summary}<span className="block text-xs text-navy-500">{c.event_type}</span></td>
                  <td className="pr-3 whitespace-nowrap">{c.value_amount !== null ? `${c.value_currency} ${Number(c.value_amount).toLocaleString('en-US')}` : ''}<span className="block text-xs text-navy-500">{c.value_amount !== null ? c.payment_status : ''}</span></td>
                  <td className="pr-3"><span className={`tag ${v === 'ami_verified' ? 'tag-gold' : v === 'confirmed_by_other' ? 'tag-navy' : 'tag-soft'}`}>{VERIFICATION_LABEL[v]}</span>{c.ack_status === 'disputed' ? <span className="tag tag-maroon ml-1">Questioned</span> : null}</td>
                  <td>
                    {role === 'admin' ? (
                      <form action={verifyConnectionAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="verify" value={c.ami_verified_at ? 'false' : 'true'} />
                        <button className="btn btn-ghost btn-sm" type="submit">{c.ami_verified_at ? 'Remove verification' : 'AMI verify'}</button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-navy-500">AMI verification means the team has seen the evidence (invoice, contract, message). Editing a verified connection clears the verification.</p>
    </div>
  );
}
