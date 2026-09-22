import { describe, expect, it } from 'vitest';
import { computeMetrics, verificationOf } from './metrics';
import type { AdminConnection } from './types';

const base = {
  edition_id: 'e1', event_type: 'x', summary: 'x', payment_status: 'none' as const, sdg_goals: [] as number[],
  ami_verified_at: null, created_at: '', updated_at: '', value_amount: null, value_currency: null,
};
const who = (country: string) => ({ display_name: 'n', country, participant_type: 'other' });

function conn(over: Partial<AdminConnection>): AdminConnection {
  return {
    id: Math.random().toString(), logged_by: 'a', with_participant: 'b', stage_no: 1, ack_status: 'pending',
    logger: who('South Africa'), other: { ...who('Zimbabwe'), status: 'registered' }, ...base, ...over,
  } as AdminConnection;
}

describe('verificationOf', () => {
  it('ranks AMI verification above confirmation above self-reported', () => {
    expect(verificationOf({ ami_verified_at: 'x', ack_status: 'pending' })).toBe('ami_verified');
    expect(verificationOf({ ami_verified_at: null, ack_status: 'confirmed' })).toBe('confirmed_by_other');
    expect(verificationOf({ ami_verified_at: null, ack_status: 'disputed' })).toBe('self_reported');
  });
});

describe('computeMetrics', () => {
  const participants = [
    { id: 'a', status: 'registered', country: 'South Africa', participant_type: 'performer_or_group' },
    { id: 'b', status: 'registered', country: 'Zimbabwe', participant_type: 'trader_or_enterprise' },
    { id: 'c', status: 'unverified', country: null, participant_type: null },
  ] as const;
  const conns = [
    conn({ stage_no: 1 }),
    conn({ stage_no: 2 }),
    conn({ stage_no: 4, value_amount: 1000, value_currency: 'ZAR', payment_status: 'paid', ack_status: 'confirmed', sdg_goals: [8, 17] }),
    conn({ stage_no: 5, value_amount: 500, value_currency: 'ZAR', payment_status: 'agreed', sdg_goals: [8], logger: who('Kenya'), other: { ...who('Kenya'), status: 'registered' } }),
  ];
  const m = computeMetrics([...participants], conns);

  it('counts participants by status', () => {
    expect(m.participants.registered).toBe(2);
    expect(m.participants.unverified).toBe(1);
    expect(m.participants.countries).toEqual(['South Africa', 'Zimbabwe']);
  });

  it('builds a cumulative funnel with conversion', () => {
    expect(m.funnel.map((f) => f.connections)).toEqual([4, 3, 2, 2, 1]);
    expect(m.funnel[1].conversion).toBe(75);
    expect(m.funnel[4].conversion).toBe(50);
  });

  it('counts cross-border connections only when countries differ', () => {
    expect(m.connections.crossBorder).toBe(3);
    expect(m.corridors[0]).toMatchObject({ from: 'South Africa', to: 'Zimbabwe', count: 3, topStage: 4 });
  });

  it('separates paid, agreed and verified value by currency', () => {
    expect(m.value.paid).toEqual({ ZAR: 1000 });
    expect(m.value.agreed).toEqual({ ZAR: 500 });
    expect(m.value.verified).toEqual({ ZAR: 1000 });
    expect(m.value.withValue).toBe(2);
  });

  it('tallies SDGs and exchange-or-beyond', () => {
    expect(m.sdg[8]).toBe(2);
    expect(m.sdg[17]).toBe(1);
    expect(m.connections.exchangeOrBeyond).toBe(2);
  });
});
