import type { Metadata } from 'next';
import { EditionSelect } from '@/components/EditionSelect';
import { loadAdminData } from '@/lib/admin-data';
import { getFramework } from '@/lib/framework-data';
import { VERIFICATION_LABEL, typeLabel } from '@/lib/framework';
import { computeMetrics, formatMoney } from '@/lib/metrics';

export const metadata: Metadata = { title: 'Admin overview' };

function Bar({ pct, tone = 'navy' }: { pct: number; tone?: 'navy' | 'gold' }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-navy-100">
      <div className={`h-full rounded-full ${tone === 'gold' ? 'bg-gold' : 'bg-navy'}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

export default async function AdminOverview({ searchParams }: { searchParams: Promise<{ edition?: string }> }) {
  const sp = await searchParams;
  const [{ editions, edition, participants, connections }, framework] = await Promise.all([loadAdminData(sp.edition), getFramework()]);
  const m = computeMetrics(participants, connections);
  const top = Math.max(1, m.funnel[0].connections);
  const total = Math.max(1, m.connections.total);
  const sdgKeys = Object.keys(m.sdg).map(Number).sort((a, b) => m.sdg[b] - m.sdg[a] || a - b);
  const sdgTop = Math.max(1, ...sdgKeys.map((k) => m.sdg[k]));

  const kpi = (value: string | number, label: string) => (
    <div className="card p-5">
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-navy-500">{label}</p>
    </div>
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Overview</h1>
          <p className="text-navy-500">{edition?.name ?? 'No edition'} · {framework.version ? `${framework.version.name} v${framework.version.version}` : 'Framework not loaded'}</p>
        </div>
        <EditionSelect editions={editions} current={edition?.id} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpi(m.participants.registered, 'registered participants')}
        {kpi(m.connections.total, 'connections logged')}
        {kpi(m.connections.crossBorder, 'cross-border connections')}
        {kpi(`${Math.round(((m.connections.verification.confirmed_by_other + m.connections.verification.ami_verified) / total) * 100)}%`, 'confirmed or verified')}
      </div>

      <section className="mt-10">
        <h2 className="text-2xl">The gateway funnel</h2>
        <p className="mb-4 text-sm text-navy-500">Connections that reached each stage or beyond.</p>
        <ol className="space-y-3">
          {m.funnel.map((f) => {
            const st = framework.stages.find((s) => s.stage_no === f.stage_no);
            return (
              <li key={f.stage_no} className="grid items-center gap-3 sm:grid-cols-[11rem_1fr_9rem]">
                <span><strong>{st?.name}</strong><span className="block text-xs text-navy-500">{st?.short_label}</span></span>
                <Bar pct={(f.connections / top) * 100} />
                <span className="text-sm"><strong>{f.connections}</strong> · {f.participants} people{f.conversion !== null ? ` · ${f.conversion}%` : ''}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="text-2xl">Economic activity reported</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-4"><dt>Connections with money involved</dt><dd className="font-semibold">{m.value.withValue}</dd></div>
            <div className="flex justify-between gap-4"><dt>Paid</dt><dd className="font-semibold">{formatMoney(m.value.paid)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Agreed, not yet paid</dt><dd className="font-semibold">{formatMoney(m.value.agreed)}</dd></div>
            <div className="flex justify-between gap-4"><dt>Confirmed or verified</dt><dd className="font-semibold">{formatMoney(m.value.verified)}</dd></div>
          </dl>
          <p className="mt-3 text-xs text-navy-500">Reported by participants, not audited, not converted between currencies.</p>
        </section>

        <section>
          <h2 className="text-2xl">Strength of the evidence</h2>
          <ul className="mt-3 space-y-3">
            {(['ami_verified', 'confirmed_by_other', 'self_reported'] as const).map((k) => (
              <li key={k}>
                <div className="mb-1 flex justify-between text-sm"><span>{VERIFICATION_LABEL[k]}</span><strong>{m.connections.verification[k]}</strong></div>
                <Bar pct={(m.connections.verification[k] / total) * 100} tone="gold" />
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-navy-500">{m.connections.byAck.pending} waiting for the other party · {m.connections.byAck.disputed} questioned</p>
        </section>

        <section>
          <h2 className="text-2xl">Cross-border corridors</h2>
          {m.corridors.length ? (
            <ul className="mt-3 space-y-2 text-sm">
              {m.corridors.slice(0, 8).map((c) => (
                <li key={`${c.from}|${c.to}`} className="flex justify-between gap-4">
                  <span>{c.from} to {c.to}</span>
                  <span><strong>{c.count}</strong> · furthest: {framework.stages.find((s) => s.stage_no === c.topStage)?.name}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-navy-500">None yet.</p>}
        </section>

        <section>
          <h2 className="text-2xl">Sustainable Development Goals</h2>
          {sdgKeys.length ? (
            <ul className="mt-3 space-y-3">
              {sdgKeys.map((k) => (
                <li key={k}>
                  <div className="mb-1 flex justify-between gap-3 text-sm"><span>Goal {k}: {framework.sdgs.find((s) => s.no === k)?.name}</span><strong>{m.sdg[k]}</strong></div>
                  <Bar pct={(m.sdg[k] / sdgTop) * 100} tone="gold" />
                </li>
              ))}
            </ul>
          ) : <p className="mt-3 text-sm text-navy-500">No goals tagged yet.</p>}
        </section>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl">Who took part</h2>
        <p className="text-sm text-navy-500">{m.participants.registered} registered · {m.participants.unverified} unverified profiles added by others · {m.participants.account} signed up but not registered · countries: {m.participants.countries.join(', ') || 'none yet'}</p>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {Object.entries(m.participants.byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
            <li key={k} className="flex justify-between gap-4 border-b border-navy/10 pb-1"><span>{k === 'not_stated' ? 'Not stated' : typeLabel(k)}</span><strong>{v}</strong></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
