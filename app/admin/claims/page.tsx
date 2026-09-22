import type { Metadata } from 'next';
import { Flash } from '@/components/Flash';
import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { decideClaimAction } from '../actions';

export const metadata: Metadata = { title: 'Admin: claims' };

interface Claim {
  id: string;
  target_name: string;
  target_country: string | null;
  requested_by: string;
  status: string;
  created_at: string;
  note: string | null;
}

export default async function AdminClaims({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const { role } = await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase.from('claim_requests').select('*').order('created_at', { ascending: false });
  const claims = (data ?? []) as Claim[];
  const requesterIds = Array.from(new Set(claims.map((c) => c.requested_by)));
  const { data: people } = requesterIds.length
    ? await supabase.from('participants').select('user_id,display_name,email,country').in('user_id', requesterIds)
    : { data: [] };
  const byUser = new Map((people ?? []).map((p: { user_id: string; display_name: string; email: string | null; country: string | null }) => [p.user_id, p]));
  const pending = claims.filter((c) => c.status === 'pending');
  const decided = claims.filter((c) => c.status !== 'pending');

  return (
    <div>
      <h1 className="text-3xl">Profile claims</h1>
      <p className="mb-6 mt-2 max-w-2xl text-navy-500">When a participant thinks an unverified profile is them, they ask for it to be linked. Check that it is really them (by phone, or in person) before approving. Approving moves the connections to their account.</p>
      <Flash notice={sp.notice} error={sp.error} />

      <h2 className="mb-3 text-xl">Waiting ({pending.length})</h2>
      {pending.length ? (
        <ul className="space-y-4">
          {pending.map((c) => {
            const who = byUser.get(c.requested_by);
            return (
              <li key={c.id} className="card">
                <p><strong>{who?.display_name ?? 'Unknown'}</strong> ({who?.email}) says they are the profile <strong>{c.target_name}</strong>{c.target_country ? `, ${c.target_country}` : ''}.</p>
                {role === 'admin' ? (
                  <form action={decideClaimAction} className="mt-3 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="id" value={c.id} />
                    <div className="min-w-[14rem] flex-1">
                      <label htmlFor={`n-${c.id}`} className="label">Note <span className="hint font-normal">Optional</span></label>
                      <input id={`n-${c.id}`} name="note" className="input py-2" />
                    </div>
                    <button className="btn btn-primary btn-sm" name="decision" value="approve" type="submit">Approve</button>
                    <button className="btn btn-ghost btn-sm" name="decision" value="reject" type="submit">Reject</button>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : <p className="text-navy-500">Nothing waiting.</p>}

      <h2 className="mb-3 mt-10 text-xl">Decided ({decided.length})</h2>
      <ul className="space-y-2 text-sm">
        {decided.map((c) => (
          <li key={c.id} className="flex flex-wrap justify-between gap-3 border-b border-navy/10 pb-2">
            <span>{byUser.get(c.requested_by)?.display_name ?? 'Unknown'} · {c.target_name}</span>
            <span className={`tag ${c.status === 'approved' ? 'tag-navy' : 'tag-soft'}`}>{c.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
