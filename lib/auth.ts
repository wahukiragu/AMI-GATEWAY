import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from './supabase/server';
import { site } from './config';
import type { Participant } from './types';

export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getMyParticipant = cache(async (): Promise<Participant | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from('participants').select('*').eq('user_id', user.id).maybeSingle();
  return (data as Participant | null) ?? null;
});

export async function requireUser(nextPath?: string) {
  const user = await getUser();
  if (!user) redirect(nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login');
  return user;
}

/** Signed in AND has accepted the current privacy notice (the data gate). */
export async function requireConsented() {
  const user = await requireUser();
  const participant = await getMyParticipant();
  if (!participant || !participant.consent_at || participant.consent_version !== site.privacyVersion) {
    redirect('/gate');
  }
  return { user, participant };
}

/** Consented AND finished Stage 1 (register). */
export async function requireRegistered() {
  const { user, participant } = await requireConsented();
  if (participant.status !== 'registered') redirect('/register');
  return { user, participant };
}

export const getStaffRole = cache(async (): Promise<'admin' | 'viewer' | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc('is_admin');
  if (isAdmin === true) return 'admin';
  const { data: isStaff } = await supabase.rpc('is_staff');
  return isStaff === true ? 'viewer' : null;
});

/** Staff area guard. Non-staff get a 404 so the area is not advertised. */
export async function requireStaff(opts?: { admin?: boolean }) {
  const user = await requireUser('/admin');
  const role = await getStaffRole();
  if (!role || (opts?.admin && role !== 'admin')) notFound();
  return { user, role };
}
