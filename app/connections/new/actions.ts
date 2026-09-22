'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRegistered } from '@/lib/auth';
import { friendlyError } from '@/lib/errors';
import { num, opt, str, type ActionResult } from '@/lib/form';

export async function createConnectionAction(fd: FormData): Promise<ActionResult> {
  await requireRegistered();
  const supabase = await createClient();

  let withId = str(fd, 'with_id');
  if (str(fd, 'mode') === 'new') {
    const { data, error } = await supabase.rpc('add_unverified_participant', {
      p_name: str(fd, 'new_name'),
      p_country: opt(fd, 'new_country'),
      p_offering: opt(fd, 'new_offering'),
      p_email: opt(fd, 'new_email'),
      p_phone: opt(fd, 'new_phone'),
    });
    if (error) return { error: friendlyError(error) };
    withId = String((data as { id: string }).id);
  }
  if (!withId) return { error: friendlyError({ message: 'invalid_counterparty' }) };

  const value = num(fd, 'value');
  if (Number.isNaN(value)) return { error: 'Enter the amount as a number, or leave it empty.' };

  const { error } = await supabase.rpc('create_connection', {
    p_with: withId,
    p_stage: Number(str(fd, 'stage')),
    p_event_type: str(fd, 'event_type'),
    p_summary: str(fd, 'summary'),
    p_value: value,
    p_currency: value === null ? null : str(fd, 'currency'),
    p_payment: value === null ? null : str(fd, 'payment'),
    p_sdgs: fd.getAll('sdg').map(Number).filter((n) => Number.isInteger(n)),
    p_reflection: opt(fd, 'reflection'),
    p_next_step: opt(fd, 'next_step'),
    p_remind_on: opt(fd, 'remind_on'),
  });
  if (error) return { error: friendlyError(error) };

  revalidatePath('/connections');
  redirect('/connections?notice=' + encodeURIComponent('Connection saved. The other person will be asked to confirm it.'));
}
