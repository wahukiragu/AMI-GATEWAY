import type { AdminConnection, Participant, Verification } from './types';

export function verificationOf(c: Pick<AdminConnection, 'ami_verified_at' | 'ack_status'>): Verification {
  if (c.ami_verified_at) return 'ami_verified';
  if (c.ack_status === 'confirmed') return 'confirmed_by_other';
  return 'self_reported';
}

export interface FunnelRow {
  stage_no: number;
  /** Connections that reached this stage or beyond. */
  connections: number;
  /** Distinct participants (either side) in those connections. */
  participants: number;
  /** Share of the previous stage, 0 to 100. Null for stage 1 or when the previous stage is empty. */
  conversion: number | null;
}

export interface Corridor {
  from: string;
  to: string;
  count: number;
  topStage: number;
}

export interface Metrics {
  participants: {
    registered: number;
    unverified: number;
    account: number;
    countries: string[];
    byType: Record<string, number>;
  };
  connections: {
    total: number;
    byAck: Record<'pending' | 'confirmed' | 'disputed', number>;
    verification: Record<Verification, number>;
    crossBorder: number;
    exchangeOrBeyond: number;
  };
  funnel: FunnelRow[];
  corridors: Corridor[];
  value: {
    withValue: number;
    paid: Record<string, number>;
    agreed: Record<string, number>;
    /** Paid or agreed, and confirmed by the other party or verified by AMI. */
    verified: Record<string, number>;
  };
  sdg: Record<number, number>;
}

function add(map: Record<string, number>, key: string, amount: number) {
  map[key] = Math.round(((map[key] ?? 0) + amount) * 100) / 100;
}

export function computeMetrics(
  participants: Pick<Participant, 'id' | 'status' | 'country' | 'participant_type'>[],
  connections: AdminConnection[],
): Metrics {
  const registered = participants.filter((p) => p.status === 'registered');
  const countries = Array.from(new Set(registered.map((p) => p.country).filter((c): c is string => !!c))).sort();
  const byType: Record<string, number> = {};
  registered.forEach((p) => {
    const k = p.participant_type ?? 'not_stated';
    byType[k] = (byType[k] ?? 0) + 1;
  });

  const byAck = { pending: 0, confirmed: 0, disputed: 0 };
  const verification: Record<Verification, number> = { self_reported: 0, confirmed_by_other: 0, ami_verified: 0 };
  const sdg: Record<number, number> = {};
  const paid: Record<string, number> = {};
  const agreed: Record<string, number> = {};
  const verified: Record<string, number> = {};
  const corridorMap = new Map<string, Corridor>();
  let withValue = 0;
  let crossBorder = 0;

  for (const c of connections) {
    byAck[c.ack_status] += 1;
    const v = verificationOf(c);
    verification[v] += 1;
    c.sdg_goals.forEach((g) => {
      sdg[g] = (sdg[g] ?? 0) + 1;
    });
    if (c.value_amount !== null && c.value_currency) {
      withValue += 1;
      if (c.payment_status === 'paid') add(paid, c.value_currency, c.value_amount);
      if (c.payment_status === 'agreed') add(agreed, c.value_currency, c.value_amount);
      if (v !== 'self_reported') add(verified, c.value_currency, c.value_amount);
    }
    const from = c.logger?.country;
    const to = c.other?.country;
    if (from && to && from !== to) {
      crossBorder += 1;
      const key = `${from}|${to}`;
      const row = corridorMap.get(key) ?? { from, to, count: 0, topStage: 0 };
      row.count += 1;
      row.topStage = Math.max(row.topStage, c.stage_no);
      corridorMap.set(key, row);
    }
  }

  const funnel: FunnelRow[] = [1, 2, 3, 4, 5].map((stage) => {
    const reaching = connections.filter((c) => c.stage_no >= stage);
    const people = new Set<string>();
    reaching.forEach((c) => {
      people.add(c.logged_by);
      if (c.with_participant) people.add(c.with_participant);
    });
    return { stage_no: stage, connections: reaching.length, participants: people.size, conversion: null };
  });
  for (let i = 1; i < funnel.length; i++) {
    const prev = funnel[i - 1].connections;
    funnel[i].conversion = prev > 0 ? Math.round((funnel[i].connections / prev) * 100) : null;
  }

  return {
    participants: {
      registered: registered.length,
      unverified: participants.filter((p) => p.status === 'unverified').length,
      account: participants.filter((p) => p.status === 'account').length,
      countries,
      byType,
    },
    connections: {
      total: connections.length,
      byAck,
      verification,
      crossBorder,
      exchangeOrBeyond: connections.filter((c) => c.stage_no >= 4).length,
    },
    funnel,
    corridors: Array.from(corridorMap.values()).sort((a, b) => b.count - a.count || b.topStage - a.topStage),
    value: { withValue, paid, agreed, verified },
    sdg,
  };
}

export function formatMoney(map: Record<string, number>): string {
  const parts = Object.keys(map)
    .sort()
    .map((cur) => `${cur} ${map[cur].toLocaleString('en-US', { maximumFractionDigits: 2 })}`);
  return parts.length ? parts.join(', ') : 'none reported';
}
