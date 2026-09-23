import Link from 'next/link';
import { BarsStrip } from '@/components/BarsStrip';
import { StageBars } from '@/components/StageBars';
import { getFramework } from '@/lib/framework-data';
import { getMyParticipant, getUser } from '@/lib/auth';
import { site } from '@/lib/config';
import { editionStatus, formatEditionDates } from '@/lib/dates';
import { Flash } from '@/components/Flash';

export default async function Home({ searchParams }: { searchParams: Promise<{ notice?: string }> }) {
  const sp = await searchParams;
  const framework = await getFramework();
  let user = null;
  let registered = false;
  try {
    user = await getUser();
    registered = user ? (await getMyParticipant())?.status === 'registered' : false;
  } catch {
    /* Supabase not configured yet */
  }
  const cta = !user ? { href: '/login', label: 'Get started' } : registered ? { href: '/connections/new', label: 'Log a connection' } : { href: '/register', label: 'Continue registering' };

  const edition = framework.edition;
  const eventName = edition?.name ?? site.event;
  const venue = edition?.venue ?? site.venue;
  const dates = edition ? formatEditionDates(edition.starts_on, edition.ends_on) : '';
  const status = edition ? editionStatus(edition.starts_on, edition.ends_on) : null;

  return (
    <main>
      {sp.notice ? <div className="mx-auto max-w-5xl px-5 pt-6"><Flash notice={sp.notice} /></div> : null}
      <section className="relative overflow-hidden bg-sand">
        <BarsStrip className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full opacity-90 sm:h-56" />
        <div className="relative mx-auto max-w-5xl px-5 pb-52 pt-14 sm:pb-64 sm:pt-20">
          <p className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold uppercase tracking-wide text-maroon">
            <span>{eventName}{dates ? ` · ${dates}` : ''}{venue ? ` · ${venue}` : ''}</span>
            {status && status.phase !== 'unknown' ? <span className="tag tag-navy normal-case tracking-normal">{status.label}</span> : null}
          </p>
          <h1 className="max-w-3xl text-4xl leading-[1.1] sm:text-6xl">Turn festival conversations into lasting connections.</h1>
          <p className="mt-5 max-w-2xl text-lg">
            {site.name} is a simple way to record the meaningful connections you make at the festival: who you met, what came of it, and whether it led to a sale, a booking or a partnership.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={cta.href} className="btn btn-primary">{cta.label}</Link>
            {!user ? <Link href="/login" className="btn btn-ghost">I have registered. Log in</Link> : null}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-5 py-14 md:grid-cols-3">
        <div>
          <h2 className="mb-2 text-xl">Why we ask</h2>
          <p>Good festivals leave more than memories. Logging a connection turns a good chat into something you can follow up, and shows what the festival made possible.</p>
        </div>
        <div>
          <h2 className="mb-2 text-xl">What AMI does with it</h2>
          <p>AMI adds up the results, without names, to show funders how culture contributes to jobs, trade and the Sustainable Development Goals.</p>
        </div>
        <div>
          <h2 className="mb-2 text-xl">What you get</h2>
          <p>A private record of your connections, an emailed summary and reminders, and a way to see how each one grows.</p>
        </div>
      </section>

      <section className="bg-navy text-white">
        <div className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="text-3xl">Two stages, about two minutes each</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl2 bg-white/10 p-6">
              <p className="text-sm font-semibold text-gold">Stage 1</p>
              <h3 className="mt-1 text-2xl">Register as a participant</h3>
              <p className="mt-2 text-white/85">Once only. Tell us who you are, what you bring and what you hope for. You sign in with your email, and stay signed in on your phone until you log out.</p>
            </div>
            <div className="rounded-xl2 bg-white/10 p-6">
              <p className="text-sm font-semibold text-gold">Stage 2</p>
              <h3 className="mt-1 text-2xl">Log a connection</h3>
              <p className="mt-2 text-white/85">Whenever you meet someone worth following up. Choose them from the list, or add them if they are not registered yet. They will be asked to confirm.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-14">
        <h2 className="text-3xl">How far did the connection travel?</h2>
        <p className="mt-2 max-w-2xl">
          The {site.frameworkName} follows a connection from first meeting to lasting partnership. You choose the stage that fits, and you can move it forward later.
        </p>
        <ol className="mt-8 grid gap-4 md:grid-cols-5">
          {framework.stages.map((s) => (
            <li key={s.stage_no} className="rounded-xl2 border border-navy/10 p-4">
              <StageBars stage={s.stage_no} />
              <h3 className="mt-3 text-lg">{s.name}</h3>
              <p className="text-sm text-navy-500">{s.short_label}</p>
              <p className="mt-2 text-sm">{s.meaning}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-6">
        <div className="card">
          <h2 className="text-xl">Your information, your choice</h2>
          <p className="mt-2 max-w-3xl">
            You will read a short privacy notice and agree before anything is collected. You can see, save or delete your information at any time. Your private notes are never shown to anyone else.
          </p>
          <p className="mt-3"><Link href="/privacy" className="font-semibold underline">Read the privacy notice</Link></p>
        </div>
      </section>
    </main>
  );
}
