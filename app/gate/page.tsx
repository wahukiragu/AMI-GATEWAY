import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { GateForm } from './GateForm';
import { PrivacyNotice } from '@/components/PrivacyNotice';
import { getMyParticipant, requireUser } from '@/lib/auth';
import { site } from '@/lib/config';

export const metadata: Metadata = { title: 'Your information' };

export default async function GatePage() {
  await requireUser('/gate');
  const participant = await getMyParticipant();
  if (participant?.consent_at && participant.consent_version === site.privacyVersion) {
    redirect(participant.status === 'registered' ? '/connections' : '/register');
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-maroon">Before you start</p>
      <h1 className="mt-1 text-3xl">Your information, your choice</h1>
      <p className="mt-3 max-w-2xl text-lg">In short: we collect what you enter to help you follow up your connections, and AMI reports totals to funders without names. Your private notes are never shown to anyone else, and you can delete everything at any time.</p>

      <details className="card mt-6">
        <summary className="cursor-pointer text-lg font-bold">Read the full privacy notice</summary>
        <div className="mt-4"><PrivacyNotice /></div>
      </details>

      <div className="card mt-6">
        <GateForm />
      </div>
    </main>
  );
}
