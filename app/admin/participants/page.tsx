import type { Metadata } from 'next';
import { loadAdminData } from '@/lib/admin-data';
import { typeLabel } from '@/lib/framework';

export const metadata: Metadata = { title: 'Admin: participants' };

const statusTag = (s: string) =>
  s === 'registered' ? <span className="tag tag-navy">Registered</span> : s === 'account' ? <span className="tag tag-gold">Signed up</span> : <span className="tag tag-soft">Unverified</span>;

export default async function AdminParticipants({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const { participants } = await loadAdminData();
  const rows = sp.status ? participants.filter((p) => p.status === sp.status) : participants;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Participants ({rows.length})</h1>
          <p className="text-sm text-maroon">Contains personal data. Internal use only.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/admin/participants" className="btn btn-ghost btn-sm">All</a>
          <a href="/admin/participants?status=registered" className="btn btn-ghost btn-sm">Registered</a>
          <a href="/admin/participants?status=unverified" className="btn btn-ghost btn-sm">Unverified</a>
          <a href="/admin/export/participants" className="btn btn-primary btn-sm">Save internal list (.csv)</a>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b-2 border-navy"><th className="py-2 pr-3">Name</th><th className="pr-3">Status</th><th className="pr-3">Type</th><th className="pr-3">Country</th><th className="pr-3">Contact</th><th>Named in reports</th></tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-navy/10 align-top">
                <td className="py-2 pr-3"><strong>{p.display_name}</strong>{p.organisation ? <span className="block text-xs text-navy-500">{p.organisation}</span> : null}</td>
                <td className="pr-3">{statusTag(p.status)}</td>
                <td className="pr-3">{typeLabel(p.participant_type)}</td>
                <td className="pr-3">{p.country ?? ''}</td>
                <td className="pr-3">{p.email}{p.phone ? <span className="block">{p.phone}</span> : null}</td>
                <td>{p.consent_public_name ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
