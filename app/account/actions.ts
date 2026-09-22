'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireConsented } from '@/lib/auth';
import { friendlyError } from '@/lib/errors';
import { checked, str } from '@/lib/form';

export async function updateConsentsAction(fd: FormData): Promise<void> {
  await requireConsented();
  const supabase = await createClient();
  const { error } = await supabase.rpc('update_consents', {
    p_public_name: checked(fd, 'public_name'),
    p_future_contact: checked(fd, 'future_contact'),
  });
  if (error) redirect('/account?error=' + encodeURIComponent(friendlyError(error)));
  revalidatePath('/account');
  redirect('/account?notice=' + encodeURIComponent('Your choices are saved.'));
}

/** Deletes the participant's data, then their sign-in account, then signs them out. */
export async function deleteAccountAction(fd: FormData): Promise<void> {
  const { user } = await requireConsented();
  if (str(fd, 'confirm').toLowerCase() !== 'delete') {
    redirect('/account?error=' + encodeURIComponent('Type the word delete to confirm.'));
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc('delete_my_data');
  if (error) redirect('/account?error=' + encodeURIComponent(friendlyError(error)));

  try {
    await createAdminClient().auth.admin.deleteUser(user.id);
  } catch {
    // Data is already deleted. If the service key is missing, staff can remove the sign-in record in Supabase.
  }
  await supabase.auth.signOut();
  redirect('/?notice=' + encodeURIComponent('Your information has been deleted.'));
}
