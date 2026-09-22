'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/auth';
import { friendlyError } from '@/lib/errors';
import { opt, str } from '@/lib/form';

export async function verifyConnectionAction(fd: FormData): Promise<void> {
  await requireStaff({ admin: true });
  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_verify_connection', { p_id: str(fd, 'id'), p_verify: str(fd, 'verify') === 'true' });
  if (error) redirect('/admin/connections?error=' + encodeURIComponent(friendlyError(error)));
  revalidatePath('/admin', 'layout');
  redirect('/admin/connections?notice=' + encodeURIComponent('Saved.'));
}

export async function decideClaimAction(fd: FormData): Promise<void> {
  await requireStaff({ admin: true });
  const supabase = await createClient();
  const approve = str(fd, 'decision') === 'approve';
  const { error } = await supabase.rpc('decide_claim', { p_request: str(fd, 'id'), p_approve: approve, p_note: opt(fd, 'note') });
  if (error) redirect('/admin/claims?error=' + encodeURIComponent(friendlyError(error)));
  revalidatePath('/admin', 'layout');
  redirect('/admin/claims?notice=' + encodeURIComponent(approve ? 'Approved. The profile is now linked.' : 'Rejected.'));
}
