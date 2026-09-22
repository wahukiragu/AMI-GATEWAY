'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireRegistered } from '@/lib/auth';
import { friendlyError } from '@/lib/errors';
import { num, opt, str, type ActionResult } from '@/lib/form';

export async function updateConnectionAction(fd: FormData): Promise<ActionResult> {
  await requireRegistered();
  const id = str(fd, 'id');
  const value = num(fd, 'value');
  if (Number.isNaN(value)) return { error: 'Enter the amount as a number, or leave it empty.' };

  const supabase = await createClient();
  const { error } = await supabase.rpc('update_connection', {
    p_id: id,
    p_stage: Number(str(fd, 'stage')),
    p_event_type: str(fd, 'event_type'),
    p_note: opt(fd, 'note'),
    p_value: value,
    p_currency: value === null ? null : str(fd, 'currency'),
    p_payment: value === null ? null : str(fd, 'payment'),
    p_reflection: opt(fd, 'reflection'),
    p_next_step: opt(fd, 'next_step'),
    p_remind_on: opt(fd, 'remind_on'),
  });
  if (error) return { error: friendlyError(error) };

  revalidatePath('/connections');
  revalidatePath(`/connections/${id}`);
  redirect(`/connections/${id}?notice=` + encodeURIComponent('Updated. The other person will be asked to confirm the change.'));
}
