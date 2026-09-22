import Link from 'next/link';
import { site } from '@/lib/config';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-navy/10 bg-sand">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-5 py-6 text-sm text-navy-500">
        <p>
          {site.org} · {site.event}, {site.venue}
        </p>
        <nav className="flex gap-5" aria-label="Footer">
          <Link href="/privacy" className="underline">Privacy notice</Link>
          {site.contactEmail ? <a href={`mailto:${site.contactEmail}`} className="underline">Contact</a> : null}
        </nav>
      </div>
    </footer>
  );
}
