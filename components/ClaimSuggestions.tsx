import { createClient } from '@/lib/supabase/server';
import { requestClaimAction } from '@/app/connections/actions';

interface Suggestion {
  participant_id: string;
  display_name: string;
  country: string | null;
  pending_connections: number;
}

/** Offers "Is this you?" when someone logged a connection with an unregistered profile that looks like this user. */
export async function ClaimSuggestions({ returnTo }: { returnTo: 'register' | 'connections' }) {
  const supabase = await createClient();
  const { data } = await supabase.rpc('suggest_claims');
  const items = (data ?? []) as Suggestion[];
  if (!items.length) return null;

  return (
    <section className="card mb-8 border-gold" aria-labelledby="claims-h">
      <h2 id="claims-h" className="text-lg">Is this you?</h2>
      <p className="mt-1 text-sm text-navy-500">Someone at the festival logged a connection with a profile that looks like yours. If it is you, ask AMI to link it. They will check before anything is shared.</p>
      <ul className="mt-4 space-y-3">
        {items.map((s) => (
          <li key={s.participant_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-sand p-3">
            <span>
              <strong>{s.display_name}</strong>{s.country ? `, ${s.country}` : ''}
              <span className="block text-sm text-navy-500">{s.pending_connections} connection{s.pending_connections === 1 ? '' : 's'} waiting</span>
            </span>
            <form action={requestClaimAction}>
              <input type="hidden" name="participant_id" value={s.participant_id} />
              <input type="hidden" name="return_to" value={returnTo} />
              <button type="submit" className="btn btn-primary btn-sm">That is me</button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
