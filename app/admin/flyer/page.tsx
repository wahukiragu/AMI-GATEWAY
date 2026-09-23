import type { Metadata } from 'next';
import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import type { Edition } from '@/lib/types';

export const metadata: Metadata = { title: 'Admin: flyer' };

export default async function AdminFlyer() {
  await requireStaff();
  const supabase = await createClient();
  const { data } = await supabase.from('editions').select('*').eq('is_current', true).maybeSingle();
  const edition = data as Edition | null;

  return (
    <div>
      <h1 className="text-3xl">Printable flyer</h1>
      <p className="mt-2 max-w-2xl text-navy-500">
        Two QR codes: one takes a first-time visitor to the homepage to register, the other takes a returning participant straight to logging a
        connection. Always points at whichever edition is currently marked <strong>current</strong> — no need to remake this for a future event.
      </p>
      {!edition ? (
        <p className="mt-4 rounded-xl bg-gold-100 p-3 text-sm">No edition is currently marked as current — set one on the Editions page first.</p>
      ) : null}

      <div className="mb-6 mt-6 flex flex-wrap gap-3">
        <a className="btn btn-primary" href="/admin/flyer/raw?print=1" target="_blank" rel="noreferrer">Print or save as PDF</a>
        <a className="btn btn-ghost" href="/admin/flyer/raw" target="_blank" rel="noreferrer">Open in a new tab</a>
      </div>

      <iframe title="Flyer preview" src="/admin/flyer/raw" className="h-[75vh] w-full rounded-xl2 border border-navy/15" />
    </div>
  );
}
