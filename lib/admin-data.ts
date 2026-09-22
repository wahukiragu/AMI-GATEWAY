import { createClient } from './supabase/server';
import type { AdminConnection, Edition, Participant } from './types';

const CONNECTION_SELECT = `*,
  logger:participants!logged_by(display_name,country,participant_type),
  other:participants!with_participant(display_name,country,participant_type,status)`;

/**
 * Everything the staff pages need, read as the signed-in staff member.
 * Row level security decides what comes back, so a non-staff user gets nothing.
 * Note: PostgREST returns at most 1,000 rows per request by default. For very large
 * editions, move these aggregates into SQL views or functions.
 */
export async function loadAdminData(editionId?: string) {
  const supabase = await createClient();
  const { data: editionRows } = await supabase.from('editions').select('*').order('year', { ascending: false });
  const editions = (editionRows ?? []) as Edition[];
  const edition = editions.find((e) => e.id === editionId) ?? editions.find((e) => e.is_current) ?? editions[0] ?? null;

  const { data: participantRows } = await supabase.from('participants').select('*').order('created_at', { ascending: false });
  let query = supabase.from('connections').select(CONNECTION_SELECT).order('created_at', { ascending: false });
  if (edition) query = query.eq('edition_id', edition.id);
  const { data: connectionRows } = await query;

  return {
    editions,
    edition,
    participants: (participantRows ?? []) as Participant[],
    connections: (connectionRows ?? []) as unknown as AdminConnection[],
  };
}
