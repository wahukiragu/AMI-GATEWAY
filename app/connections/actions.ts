'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireConsented, requireRegistered } from '@/lib/auth';
import { site } from '@/lib/config';
import { friendlyError } from '@/lib/errors';
import { opt, str } from '@/lib/form';
import { sendEmail } from '@/lib/email';
import { buildSummary } from '@/lib/summary';
import type { MyConnection } from '@/lib/types';

const back = (kind: 'notice' | 'error', message: string, path = '/connections') =>
  `${path}?${kind}=${encodeURIComponent(message)}`;

/** The other party confirms, or says a connection is not quite right. */
export async function acknowledgeAction(fd: FormData): Promise<void> {
  await requireRegistered();
  const decision = str(fd, 'decision');
  const supabase = await createClient();
  const { error } = await supabase.rpc('acknowledge_connection', {
    p_id: str(fd, 'id'),
    p_decision: decision,
    p_note: opt(fd, 'note'),
  });
  if (error) redirect(back('error', friendlyError(error)));
  revalidatePath('/connections');
  redirect(back('notice', decision === 'confirmed' ? 'Thank you. The connection is confirmed.' : 'Thank you. We have noted that it is not quite right.'));
}

/** Emails the participant a private summary of their connections. */
export async function emailSummaryAction(): Promise<void> {
  const { user, participant } = await requireRegistered();
  if (!user.email) redirect(back('error', 'We do not have an email address for you.'));
  const supabase = await createClient();
  const { data } = await supabase.rpc('my_connections');
  const summary = buildSummary(participant.display_name, (data ?? []) as MyConnection[], `${site.siteUrl}/connections`);
  const result = await sendEmail({ to: user.email!, subject: summary.subject, text: summary.text, html: summary.html });
  if (!result.ok) {
    redirect(back('error', result.error === 'not_configured'
      ? 'Email is not switched on yet. Use "Save summary" to download it instead.'
      : 'We could not send the email. Please try again, or use "Save summary".'));
  }
  redirect(back('notice', `Summary sent to ${user.email}.`));
}

/** "Is this profile you?" Sends a claim request for AMI to approve. */
export async function requestClaimAction(fd: FormData): Promise<void> {
  await requireConsented();
  const supabase = await createClient();
  const { error } = await supabase.rpc('request_claim', { p_participant: str(fd, 'participant_id') });
  const path = str(fd, 'return_to') === 'register' ? '/register' : '/connections';
  if (error) redirect(back('error', friendlyError(error), path));
  redirect(back('notice', 'Request sent. The AMI team will check it and link the profile to you.', path));
}
