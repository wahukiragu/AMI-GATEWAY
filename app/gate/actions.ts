'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { site } from '@/lib/config';
import { friendlyError } from '@/lib/errors';
import { checked, type ActionResult } from '@/lib/form';

export async function saveConsent(fd: FormData): Promise<ActionResult> {
  const user = await requireUser('/gate');
  if (!checked(fd, 'agreed') || !checked(fd, 'adult')) {
    return { error: 'Please tick both required boxes to continue.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc('record_consent', {
    p_version: site.privacyVersion,
    p_agreed: true,
    p_adult: true,
    p_public_name: checked(fd, 'public_name'),
    p_future_contact: checked(fd, 'future_contact'),
  });
  if (error) return { error: friendlyError(error) };

  const { data } = await supabase.from('participants').select('status').eq('user_id', user.id).maybeSingle();
  redirect(data?.status === 'registered' ? '/connections' : '/register');
}
