'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireStaff } from '@/lib/auth';
import { friendlyError } from '@/lib/errors';
import { checked, opt, str } from '@/lib/form';

export async function createEditionAction(fd: FormData): Promise<void> {
  await requireStaff({ admin: true });
  const supabase = await createClient();
  const { error } = await supabase.rpc('create_edition', {
    p_name: str(fd, 'name'),
    p_venue: opt(fd, 'venue'),
    p_starts: str(fd, 'starts_on') || null,
    p_ends: opt(fd, 'ends_on'),
    p_make_current: checked(fd, 'make_current'),
  });
  if (error) redirect('/admin/editions?error=' + encodeURIComponent(friendlyError(error)));
  revalidatePath('/', 'layout');
  redirect('/admin/editions?notice=' + encodeURIComponent('Edition created.'));
}

export async function setCurrentEditionAction(fd: FormData): Promise<void> {
  await requireStaff({ admin: true });
  const supabase = await createClient();
  const { error } = await supabase.rpc('set_current_edition', { p_id: str(fd, 'id') });
  if (error) redirect('/admin/editions?error=' + encodeURIComponent(friendlyError(error)));
  revalidatePath('/', 'layout');
  redirect('/admin/editions?notice=' + encodeURIComponent('That edition is now current. New registrations and connections will use it.'));
}
