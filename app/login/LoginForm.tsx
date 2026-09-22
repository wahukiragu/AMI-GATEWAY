'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const clean = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({ email: clean, options: { shouldCreateUser: true } });
    setBusy(false);
    if (err) {
      setError(err.message.toLowerCase().includes('rate') ? 'Please wait a minute before asking for another code.' : 'We could not send the code. Please try again.');
      return;
    }
    setEmail(clean);
    setStep('code');
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^\d{6,8}$/.test(code.trim())) {
      setError('Enter the code from the email. It is 6 to 8 digits.');
      return;
    }
    setBusy(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' });
    setBusy(false);
    if (err) {
      setError('That code did not work. Check it, or ask for a new one.');
      return;
    }
    router.replace(next);
    router.refresh();
  }

  if (step === 'email') {
    return (
      <form onSubmit={sendCode} noValidate>
        <label htmlFor="email" className="label">Your email address</label>
        <input id="email" type="email" inputMode="email" autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        {error ? <p className="err" role="alert">{error}</p> : null}
        <button type="submit" className="btn btn-primary mt-5 w-full" disabled={busy}>{busy ? 'Sending…' : 'Email me a code'}</button>
        <p className="hint mt-3">New here? The same step creates your portal. You will stay signed in on this device until you log out.</p>
      </form>
    );
  }

  return (
    <form onSubmit={verify} noValidate>
      <p className="mb-4">We sent a code to <strong>{email}</strong>. It can take a minute to arrive.</p>
      <label htmlFor="code" className="label">Code from the email</label>
      <input id="code" inputMode="numeric" autoComplete="one-time-code" className="input text-center text-2xl tracking-widest" value={code} onChange={(e) => setCode(e.target.value)} maxLength={8} />
      {error ? <p className="err" role="alert">{error}</p> : null}
      <button type="submit" className="btn btn-primary mt-5 w-full" disabled={busy}>{busy ? 'Checking…' : 'Sign in'}</button>
      <button type="button" className="btn btn-ghost mt-3 w-full" onClick={() => { setStep('email'); setCode(''); setError(''); }}>Use a different email</button>
    </form>
  );
}
