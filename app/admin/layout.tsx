import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role } = await requireStaff();
  const supabase = await createClient();
  const { count } = await supabase.from('claim_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending');

  const item = 'rounded-lg px-3 py-2 text-sm font-semibold hover:bg-navy-100';
  return (
    <div>
      <div className="border-b border-navy/10 bg-sand">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-1 px-5 py-2" aria-label="Admin">
          <span className="tag tag-navy mr-2">{role === 'admin' ? 'Admin' : 'Viewer'}</span>
          <Link href="/admin" className={item}>Overview</Link>
          <Link href="/admin/participants" className={item}>Participants</Link>
          <Link href="/admin/connections" className={item}>Connections</Link>
          <Link href="/admin/claims" className={item}>Claims{count ? ` (${count})` : ''}</Link>
          <Link href="/admin/report" className={item}>Report and evidence pack</Link>
          <Link href="/admin/editions" className={item}>Editions</Link>
          <Link href="/admin/flyer" className={item}>Flyer</Link>
          <Link href="/wall" className={item} target="_blank" rel="noreferrer">Live wall ↗</Link>
          <Link href="/admin/framework" className={item}>Framework</Link>
        </nav>
      </div>
      <div className="mx-auto max-w-6xl px-5 py-10">{children}</div>
    </div>
  );
}
