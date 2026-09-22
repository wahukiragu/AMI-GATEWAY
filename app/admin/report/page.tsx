import type { Metadata } from 'next';
import { EditionSelect } from '@/components/EditionSelect';
import { loadAdminData } from '@/lib/admin-data';

export const metadata: Metadata = { title: 'Admin: report and evidence pack' };

export default async function AdminReport({ searchParams }: { searchParams: Promise<{ edition?: string }> }) {
  const sp = await searchParams;
  const { editions, edition } = await loadAdminData(sp.edition);
  const q = edition ? `?edition=${edition.id}` : '';

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Report and evidence pack</h1>
          <p className="mt-2 max-w-2xl text-navy-500">The report is built live from the registry. It is anonymised: no names or free text. Names appear only for participants who agreed to be named.</p>
        </div>
        <EditionSelect editions={editions} current={edition?.id} />
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <a className="btn btn-primary" href={`/admin/evidence-pack${q}`}>Download evidence pack (.zip)</a>
        <a className="btn btn-ghost" href={`/admin/report/raw${q}${q ? '&' : '?'}print=1`} target="_blank" rel="noreferrer">Print or save as PDF</a>
        <a className="btn btn-ghost" href={`/admin/report/raw${q}`} target="_blank" rel="noreferrer">Open in a new tab</a>
      </div>

      <ul className="mb-6 max-w-3xl list-disc space-y-1 pl-5 text-sm text-navy-500">
        <li>The evidence pack contains the report, an anonymised connections file, the metrics, the framework description, and a manifest with a SHA-256 fingerprint for each file.</li>
        <li>Add the consent forms, highlights film, photos and audience feedback from the archive before sending to a funder.</li>
        <li>Internal lists with names and contacts are on the Participants and Connections pages and are never part of the pack.</li>
      </ul>

      <iframe title="Festival Gateway Report preview" src={`/admin/report/raw${q}`} className="h-[75vh] w-full rounded-xl2 border border-navy/15" />
    </div>
  );
}
