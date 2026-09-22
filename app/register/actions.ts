'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireConsented } from '@/lib/auth';
import { COUNTRIES, PARTICIPANT_TYPES, WANTS } from '@/lib/framework';
import { friendlyError } from '@/lib/errors';
import { opt, str, type ActionResult } from '@/lib/form';

export async function registerAction(fd: FormData): Promise<ActionResult> {
  const { participant } = await requireConsented();
  const name = str(fd, 'name');
  const type = str(fd, 'type');
  const country = str(fd, 'country');
  if (!name) return { error: 'Please enter your name or the name of your group.' };
  if (!PARTICIPANT_TYPES.some((t) => t.value === type)) return { error: 'Please choose what best describes you.' };
  if (!COUNTRIES.includes(country)) return { error: 'Please choose your country.' };

  const wants = fd.getAll('wants').map(String).filter((w) => WANTS.includes(w));
  const supabase = await createClient();
  const { error } = await supabase.rpc('register_participant', {
    p_name: name,
    p_org: opt(fd, 'org'),
    p_type: type,
    p_country: country,
    p_offering: opt(fd, 'offering'),
    p_wants: wants,
    p_phone: opt(fd, 'phone'),
  });
  if (error) return { error: friendlyError(error) };

  revalidatePath('/', 'layout');
  if (participant.status === 'registered') redirect('/connections?notice=' + encodeURIComponent('Your details are saved.'));
  redirect('/connections/new?notice=' + encodeURIComponent('You are registered. Now log your first connection.'));
}
