import Link from 'next/link';
import { Logo } from './Logo';
import { getMyParticipant, getStaffRole, getUser } from '@/lib/auth';
import { getFramework } from '@/lib/framework-data';
import { site } from '@/lib/config';
import { editionStatus, formatEditionDates } from '@/lib/dates';

export async function SiteHeader() {
  let user = null;
  let role: 'admin' | 'viewer' | null = null;
  let registered = false;
  const framework = await getFramework();
  try {
    user = await getUser();
    if (user) {
      role = await getStaffRole();
      registered = (await getMyParticipant())?.status === 'registered';
    }
  } catch {
    // Supabase not configured yet: show the public header.
  }

  const edition = framework.edition;
  const eventName = edition?.name ?? site.event;
  const dates = edition ? formatEditionDates(edition.starts_on, edition.ends_on) : '';
  const status = edition ? editionStatus(edition.starts_on, edition.ends_on) : null;

  const link = 'rounded-lg px-3 py-2 text-sm font-semibold hover:bg-navy-50';
  return (
    <header className="sticky top-0 z-20 border-b border-navy/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-5 py-2">
        <Link href="/" className="flex items-center gap-3" aria-label={`${site.name} home`}>
          <Logo className="h-12 w-auto" />
          <span className="hidden text-sm font-semibold leading-tight sm:block">
            {site.name}
            <span className="flex items-center gap-1.5 text-xs font-normal text-navy-500">
              {eventName}{dates ? ` · ${dates}` : ''}
              {status?.phase === 'live' ? <span className="tag tag-gold px-1.5 py-0 text-[10px]">{status.label}</span> : null}
            </span>
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-1" aria-label="Main">
          {user ? (
            <>
              <Link href="/register" className={link}>Stage 1 · Register</Link>
              {registered ? <Link href="/connections/new" className={link}>Stage 2 · Log a connection</Link> : null}
              {registered ? <Link href="/connections" className={link}>My connections</Link> : null}
              {role ? <Link href="/admin" className={link}>Admin</Link> : null}
              <form action="/auth/signout" method="post">
                <button className={`${link} text-navy-500`} type="submit">Log out</button>
              </form>
            </>
          ) : (
            <Link href="/login" className="btn btn-primary btn-sm">Log in</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
