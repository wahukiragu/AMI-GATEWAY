'use client';

import { useEffect, useRef, useState } from 'react';
import { editionStatus, formatEditionDates } from '@/lib/dates';
import type { Metrics } from '@/lib/metrics';

interface WallEdition {
  name: string;
  venue: string | null;
  starts_on: string | null;
  ends_on: string | null;
}
interface WallStage {
  stage_no: number;
  name: string;
  short_label: string;
}
interface WallPayload {
  edition: WallEdition | null;
  stages: WallStage[];
  metrics: Metrics;
  generatedAt: string;
}

const REFRESH_MS = 20_000;

function Kpi({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-6">
      <p className="text-6xl font-bold tabular-nums text-gold">{value}</p>
      <p className="mt-1 text-lg text-white/70">{label}</p>
    </div>
  );
}

export function WallDisplay({ initial }: { initial: WallPayload }) {
  const [data, setData] = useState<WallPayload>(initial);
  const [connected, setConnected] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch('/api/wall-stats', { cache: 'no-store' });
        if (!res.ok) throw new Error(String(res.status));
        setData(await res.json());
        setConnected(true);
      } catch {
        setConnected(false);
      }
    }
    timer.current = setInterval(poll, REFRESH_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const { metrics: m, stages, edition } = data;
  const top = Math.max(1, m.funnel[0]?.connections ?? 1);
  const total = Math.max(1, m.connections.total);
  const solidPct = Math.round(((m.connections.verification.confirmed_by_other + m.connections.verification.ami_verified) / total) * 100);
  const status = edition ? editionStatus(edition.starts_on, edition.ends_on) : null;
  const updated = new Date(data.generatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="min-h-screen bg-navy px-10 py-8 text-white" style={{ fontFamily: 'Poppins, ui-sans-serif, sans-serif' }}>
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-white/15 pb-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-gold">AMI Gateway · Culture-Trade Gateway Framework</p>
          <h1 className="mt-1 text-5xl font-bold leading-tight">{edition?.name ?? 'No edition set'}</h1>
          <p className="mt-2 text-xl text-white/70">
            {edition ? formatEditionDates(edition.starts_on, edition.ends_on) : ''}{edition?.venue ? ` · ${edition.venue}` : ''}
          </p>
        </div>
        {status && status.phase !== 'unknown' ? (
          <span className="rounded-full bg-gold px-6 py-2 text-2xl font-bold text-navy">{status.label}</span>
        ) : null}
      </header>

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
        <Kpi value={m.participants.registered} label="registered participants" />
        <Kpi value={m.connections.total} label="connections logged" />
        <Kpi value={m.connections.crossBorder} label="cross-border connections" />
        <Kpi value={`${Number.isFinite(solidPct) ? solidPct : 0}%`} label="confirmed or verified" />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h2 className="mb-4 text-2xl font-bold text-gold">The gateway funnel</h2>
          <ol className="space-y-4">
            {m.funnel.map((f) => {
              const st = stages.find((s) => s.stage_no === f.stage_no);
              return (
                <li key={f.stage_no} className="grid grid-cols-[9rem_1fr_5rem] items-center gap-4">
                  <span className="text-lg font-semibold">{st?.name ?? `Stage ${f.stage_no}`}</span>
                  <div className="h-6 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${Math.max(3, (f.connections / top) * 100)}%` }} />
                  </div>
                  <span className="text-right text-lg font-bold tabular-nums">{f.connections}</span>
                </li>
              );
            })}
          </ol>
        </section>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-gold">Cross-border corridors</h2>
          {m.corridors.length ? (
            <ul className="space-y-2 text-lg">
              {m.corridors.slice(0, 6).map((c) => (
                <li key={`${c.from}|${c.to}`} className="flex justify-between gap-4 border-b border-white/10 pb-2">
                  <span>{c.from} → {c.to}</span>
                  <span className="font-bold tabular-nums">{c.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-white/50">None yet — the first cross-border connection will appear here.</p>
          )}
        </section>
      </div>

      <footer className="mt-10 flex items-center justify-between text-sm text-white/40">
        <span>{connected ? 'Live' : 'Connection lost — retrying'} · updates every {REFRESH_MS / 1000}s</span>
        <span>Last updated {updated}</span>
      </footer>
    </div>
  );
}
