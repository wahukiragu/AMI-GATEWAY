import type { Metadata } from 'next';
import { RegisterForm } from './RegisterForm';
import { ClaimSuggestions } from '@/components/ClaimSuggestions';
import { Flash } from '@/components/Flash';
import { requireConsented } from '@/lib/auth';

export const metadata: Metadata = { title: 'Stage 1: Register' };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ notice?: string; error?: string }> }) {
  const sp = await searchParams;
  const { user, participant } = await requireConsented();
  const isNew = participant.status !== 'registered';

  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <p className="text-sm font-semibold uppercase tracking-wide text-maroon">Stage 1 of 2</p>
      <h1 className="mt-1 text-3xl">{isNew ? 'Register as a participant' : 'Your registration'}</h1>
      <p className="mb-8 mt-2 text-lg">
        {isNew
          ? 'Tell us who you are and what you bring. It takes about two minutes, and you only do it once.'
          : 'Keep your details up to date so people can find you and follow up.'}
      </p>
      <Flash notice={sp.notice} error={sp.error} />
      <ClaimSuggestions returnTo="register" />
      <div className="card">
        <RegisterForm participant={participant} email={user.email ?? ''} />
      </div>
    </main>
  );
}
