import type { Metadata } from 'next';
import Link from 'next/link';
import { Flash } from '@/components/Flash';
import { requireConsented } from '@/lib/auth';
import { typeLabel } from '@/lib/framework';
import { deleteAccountAction, updateConsentsAction } from './actions';

export const metadata: Metadata = { title: 'Account' };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const { user, participant } = await requireConsented();

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-3xl">Account and your data</h1>
      <Flash notice={sp.notice} error={sp.error} />

      <section className="card mt-6">
        <h2 className="text-xl">Your details</h2>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="font-semibold">Name</dt><dd>{participant.display_name}</dd>
          <dt className="font-semibold">Email</dt><dd>{user.email}</dd>
          <dt className="font-semibold">Type</dt><dd>{typeLabel(participant.participant_type)}</dd>
          <dt className="font-semibold">Country</dt><dd>{participant.country ?? 'Not stated'}</dd>
        </dl>
        <p className="mt-4"><Link href="/register" className="font-semibold underline">Edit your registration</Link></p>
      </section>

      <section className="card mt-6">
        <h2 className="text-xl">Your choices</h2>
        <form action={updateConsentsAction} className="mt-3 space-y-3">
          <label className="flex items-start gap-3">
            <input type="checkbox" name="public_name" defaultChecked={participant.consent_public_name} className="mt-1 h-5 w-5 accent-navy" />
            <span>AMI may name me or my group when sharing festival results and stories.</span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" name="future_contact" defaultChecked={participant.consent_future_contact} className="mt-1 h-5 w-5 accent-navy" />
            <span>AMI may contact me about future editions of the festival.</span>
          </label>
          <button type="submit" className="btn btn-primary btn-sm">Save choices</button>
        </form>
        <p className="mt-4 text-sm text-navy-500">Privacy notice version accepted: {participant.consent_version}. <Link href="/privacy" className="underline">Read it again</Link>.</p>
      </section>

      <section className="card mt-6">
        <h2 className="text-xl">Save a copy of your information</h2>
        <p className="mt-2 text-sm text-navy-500">Everything we hold about you and your connections, as a file.</p>
        <p className="mt-3"><a href="/account/export" className="btn btn-ghost btn-sm">Save my data (.json)</a></p>
      </section>

      <section className="card mt-6 border-maroon/40">
        <h2 className="text-xl text-maroon">Delete my account and information</h2>
        <p className="mt-2 text-sm">This removes your registration, the connections you logged and your private notes. Connections other people logged about you stay in their records without your name. This cannot be undone.</p>
        <form action={deleteAccountAction} className="mt-4">
          <label htmlFor="confirm" className="label">Type <strong>delete</strong> to confirm</label>
          <input id="confirm" name="confirm" className="input mb-4" autoComplete="off" />
          <button type="submit" className="btn btn-danger btn-sm">Delete everything</button>
        </form>
      </section>
    </main>
  );
}
