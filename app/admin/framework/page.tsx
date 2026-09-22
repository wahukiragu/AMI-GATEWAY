import type { Metadata } from 'next';
import { StageBars } from '@/components/StageBars';
import { getFramework } from '@/lib/framework-data';

export const metadata: Metadata = { title: 'Admin: framework' };

export default async function AdminFramework() {
  const f = await getFramework();
  return (
    <div>
      <h1 className="text-3xl">{f.version?.name ?? 'Culture-Trade Gateway Framework'}</h1>
      <p className="mt-2 text-navy-500">Version {f.version?.version ?? 'not loaded'} · {f.version?.status ?? 'unavailable'}{f.live ? '' : ' · showing built-in fallback'}</p>

      <section className="card mt-6">
        <h2 className="text-xl">Rights and licence</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="font-semibold">Rights holder</dt><dd>{f.version?.rights_holder ?? 'Not recorded'}</dd>
          <dt className="font-semibold">Licence notice</dt><dd>{f.version?.licence_notice ?? 'Not recorded'}</dd>
        </dl>
        <p className="mt-4 text-sm text-navy-500">Every connection stores the framework version it was logged under, so results stay comparable and citable when the framework is revised. Publish revisions as a new version, never by editing a published one. See docs/FRAMEWORK.md.</p>
      </section>

      <ol className="mt-8 space-y-4">
        {f.stages.map((s) => (
          <li key={s.stage_no} className="card">
            <div className="flex items-center gap-3"><StageBars stage={s.stage_no} /><h2 className="text-xl">{s.name}</h2><span className="text-sm text-navy-500">{s.short_label}</span></div>
            <p className="mt-2">{s.meaning}</p>
            <p className="mt-1 text-sm text-navy-500">Example: {s.example}</p>
            <p className="mt-1 text-sm text-navy-500">Evidence: {s.evidence_guidance}</p>
            <p className="mt-2 text-sm">Event types: {s.event_types.join(' · ')}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
